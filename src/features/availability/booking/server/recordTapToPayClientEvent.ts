/**
 * Persist Tap to Pay client-side success/failure diagnostics for production debugging.
 */

import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export type RecordTapToPayClientEventResult =
  | { ok: true; updated: boolean }
  | { ok: false; error: string; httpStatus: number };

export type TapToPayClientEventOutcome = 'failure' | 'success';

/** Keys that must never land in client_diagnostics (secrets / PII-ish). */
const DIAGNOSTICS_DENYLIST = new Set([
  'secret',
  'clientsecret',
  'client_secret',
  'connectiontoken',
  'connection_token',
  'token',
  'authorization',
  'password',
  'card',
  'cardnumber',
  'cvc',
  'cvv',
  'email',
  'phone',
  'customername',
  'customer_name',
]);

function asTrimmedString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function asDiagnostics(
  value: unknown
): Record<string, string | number | boolean | null> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof key !== 'string' || key.length > 64) continue;
    if (DIAGNOSTICS_DENYLIST.has(key.toLowerCase())) continue;
    if (raw === null) {
      out[key] = null;
      continue;
    }
    if (typeof raw === 'string') {
      out[key] = raw.slice(0, 200);
      continue;
    }
    if (typeof raw === 'boolean') {
      out[key] = raw;
      continue;
    }
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      out[key] = raw;
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Updates `booking_tap_to_pay_intents` with mobile diagnostics when paymentIntentId is known.
 */
export async function recordTapToPayClientEvent(opts: {
  businessId: string;
  bookingId: string;
  outcome: TapToPayClientEventOutcome;
  body: unknown;
}): Promise<RecordTapToPayClientEventResult> {
  const raw =
    opts.body && typeof opts.body === 'object' && !Array.isArray(opts.body)
      ? (opts.body as Record<string, unknown>)
      : {};

  const stage =
    asTrimmedString(raw.stage, 80) ??
    (opts.outcome === 'success' ? 'success' : 'unknown');
  const message = asTrimmedString(raw.message, 500);
  const code = asTrimmedString(raw.code, 120);
  const paymentIntentId = asTrimmedString(raw.paymentIntentId, 120);
  const requestId = asTrimmedString(raw.requestId, 120);
  const httpStatus = asFiniteNumber(raw.httpStatus);
  const durationMs = asFiniteNumber(raw.durationMs);
  const diagnostics = asDiagnostics(raw.diagnostics);
  const reportedAt = new Date().toISOString();

  console.warn('[tap-to-pay:client-event]', {
    outcome: opts.outcome,
    businessId: opts.businessId,
    bookingId: opts.bookingId,
    stage,
    code,
    message,
    paymentIntentId,
    httpStatus,
    requestId,
    durationMs,
    appVersion: diagnostics?.appVersion ?? null,
    osVersion: diagnostics?.osVersion ?? null,
    deviceModel: diagnostics?.deviceModel ?? null,
    readerWarm: diagnostics?.readerWarm ?? null,
    sessionInitialized: diagnostics?.sessionInitialized ?? null,
    sessionHasConnectKey: diagnostics?.sessionHasConnectKey ?? null,
  });

  if (!paymentIntentId) {
    console.warn(
      '[tap-to-pay:client-event] no paymentIntentId — skipping intent row update'
    );
    return { ok: true, updated: false };
  }

  const diagnosticsPayload: Record<string, string | number | boolean | null> = {
    ...(diagnostics ?? {}),
    requestId: requestId ?? diagnostics?.requestId ?? null,
    httpStatus: httpStatus ?? diagnostics?.httpStatus ?? null,
    outcome: opts.outcome,
    reportedAt,
  };

  const patch: Record<string, unknown> = {
    client_stage: stage,
    client_diagnostics: diagnosticsPayload,
    client_duration_ms:
      durationMs != null && durationMs >= 0 ? Math.round(durationMs) : null,
  };

  if (opts.outcome === 'failure') {
    patch.client_error_code = code;
    patch.client_error_message = message;
    patch.client_error_at = reportedAt;
  } else {
    patch.client_success_at = reportedAt;
  }

  const admin = createSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error: loadError } = await (admin as any)
    .from('booking_tap_to_pay_intents')
    .select('id, client_report_count')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .eq('booking_id', opts.bookingId)
    .eq('business_id', opts.businessId)
    .maybeSingle();

  if (loadError) {
    console.error('[tap-to-pay:client-event] load failed', loadError);
    return {
      ok: false,
      httpStatus: 500,
      error: 'Could not save Tap to Pay client report.',
    };
  }

  if (!existing?.id) {
    console.warn(
      '[tap-to-pay:client-event] no matching intent row — skipping update',
      {
        paymentIntentId,
        bookingId: opts.bookingId,
        businessId: opts.businessId,
      }
    );
    return { ok: true, updated: false };
  }

  const nextCount = Math.max(0, Number(existing.client_report_count) || 0) + 1;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (admin as any)
    .from('booking_tap_to_pay_intents')
    .update({
      ...patch,
      client_report_count: nextCount,
    })
    .eq('id', existing.id);

  if (updateError) {
    console.error('[tap-to-pay:client-event] update failed', updateError);
    return {
      ok: false,
      httpStatus: 500,
      error: 'Could not save Tap to Pay client report.',
    };
  }

  return { ok: true, updated: true };
}
