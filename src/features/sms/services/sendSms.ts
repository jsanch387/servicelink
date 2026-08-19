/**
 * Best-effort SMS send via Telnyx. Never throws: failures are logged and
 * returned as a result so callers (booking flows, cron) can continue. Mirrors
 * how owner email/push sends are treated as non-blocking side effects.
 */

import { logSms } from '../server/smsLog';
import { toE164 } from '../utils/toE164';
import { getTelnyxClient, getTelnyxFromNumber } from './telnyxClient';

export interface SendSmsParams {
  /** Raw or E.164 phone number. Normalized internally; invalid numbers are skipped. */
  to: string | null | undefined;
  /** Message body. Keep concise; opt-out language is provided by templates. */
  message: string;
  /** Logical message type for logs (e.g. `booking_confirmation`, `on_the_way`). */
  type: string;
  /** Optional request id for log correlation. */
  correlationId?: string;
}

export type SendSmsResult =
  | { sent: true; providerMessageId: string | null }
  | {
      sent: false;
      reason: 'not_configured' | 'invalid_number' | 'carrier_opt_out' | 'error';
      /** Provider/exception detail for DB + ops (truncated). */
      detail?: string;
    };

/** Max length stored in `sms_messages.error` / returned as `detail`. */
const ERROR_DETAIL_MAX = 500;

/** Telnyx 40300 — recipient texted STOP (messaging-profile block). */
export function isTelnyxCarrierOptOutError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const withErrors = error as {
    error?: { errors?: Array<{ code?: string | number }> };
    raw?: { errors?: Array<{ code?: string | number }> };
    message?: string;
  };
  const codes = [
    ...(withErrors.error?.errors ?? []),
    ...(withErrors.raw?.errors ?? []),
  ]
    .map(e => String(e.code ?? '').trim())
    .filter(Boolean);
  if (codes.some(c => c === '40300')) return true;
  const detail = formatSmsProviderError(error).toLowerCase();
  return (
    detail.includes('code=40300') ||
    detail.includes('blocked due to stop') ||
    detail.includes('existing block rule')
  );
}

function phoneLast4(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  return digits.slice(-4) || '????';
}

function truncateErrorDetail(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= ERROR_DETAIL_MAX) return trimmed;
  return `${trimmed.slice(0, ERROR_DETAIL_MAX - 1)}…`;
}

/** Best-effort string from a thrown Telnyx / network error. */
export function formatSmsProviderError(error: unknown): string {
  if (error instanceof Error) {
    const withStatus = error as Error & {
      statusCode?: number;
      status?: number;
      error?: {
        errors?: Array<{ code?: string; title?: string; detail?: string }>;
      };
    };
    const status = withStatus.statusCode ?? withStatus.status;
    const first = withStatus.error?.errors?.[0];
    const parts = [
      status != null ? `HTTP ${status}` : null,
      first?.code ? `code=${first.code}` : null,
      first?.title || first?.detail || error.message || null,
    ].filter(Boolean);
    return truncateErrorDetail(parts.join(': ') || 'unknown_error');
  }
  return truncateErrorDetail(String(error) || 'unknown_error');
}

export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const { type, message, correlationId } = params;

  const number = toE164(params.to);
  if (!number) {
    logSms(correlationId, 'info', 'skip_invalid_number', { type });
    return { sent: false, reason: 'invalid_number' };
  }

  const client = getTelnyxClient();
  const from = getTelnyxFromNumber();
  if (!client || !from) {
    logSms(correlationId, 'warn', 'skip_not_configured', { type });
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const response = await client.messages.send({
      from,
      to: number,
      text: message,
      type: 'SMS',
    });
    const providerMessageId = response.data?.id ?? null;
    logSms(correlationId, 'info', 'sent', {
      type,
      toLast4: phoneLast4(number),
      from,
      provider: 'telnyx',
      providerMessageId: providerMessageId ?? undefined,
    });
    return { sent: true, providerMessageId };
  } catch (e) {
    const detail = formatSmsProviderError(e);
    const carrierOptOut = isTelnyxCarrierOptOutError(e);
    logSms(correlationId, 'warn', 'send_failed', {
      type,
      toLast4: phoneLast4(number),
      from,
      error: detail.slice(0, 200),
      ...(carrierOptOut ? { carrierOptOut: true } : {}),
    });
    return {
      sent: false,
      reason: carrierOptOut ? 'carrier_opt_out' : 'error',
      detail,
    };
  }
}
