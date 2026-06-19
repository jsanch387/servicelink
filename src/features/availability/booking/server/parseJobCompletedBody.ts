/**
 * Parse and validate the `job_completed` request body.
 * Accepts `{ action: "job_completed" }` only (mobile today) or the full payload.
 */

import {
  JOB_COMPLETED_ACTION,
  SESSION_PAYMENT_METHODS,
  type JobCompletedRequestBody,
  type JobCompletedSessionFeeInput,
  type JobCompletedSessionPaymentInput,
} from './jobCompletedTypes';

export type ParseJobCompletedBodyResult =
  | { ok: true; body: JobCompletedRequestBody }
  | { ok: false; error: string };

function parseSessionFees(raw: unknown): JobCompletedSessionFeeInput[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return null;

  const fees: JobCompletedSessionFeeInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const label =
      typeof (item as { label?: unknown }).label === 'string'
        ? (item as { label: string }).label.trim()
        : '';
    const amountCents = (item as { amountCents?: unknown }).amountCents;
    if (!label || !Number.isInteger(amountCents) || amountCents < 0) {
      return null;
    }
    fees.push({ label, amountCents });
  }
  return fees;
}

function parseSessionPayment(
  raw: unknown
): JobCompletedSessionPaymentInput | undefined | null {
  if (raw === undefined) return undefined;
  if (!raw || typeof raw !== 'object') return null;

  const method = (raw as { method?: unknown }).method;
  const amountCents = (raw as { amountCents?: unknown }).amountCents;
  if (
    typeof method !== 'string' ||
    !(SESSION_PAYMENT_METHODS as readonly string[]).includes(method) ||
    !Number.isInteger(amountCents) ||
    amountCents < 0
  ) {
    return null;
  }

  const stripePaymentIntentId = (
    raw as { stripePaymentIntentId?: unknown }
  ).stripePaymentIntentId;
  if (
    stripePaymentIntentId !== undefined &&
    typeof stripePaymentIntentId !== 'string'
  ) {
    return null;
  }

  return {
    method: method as JobCompletedSessionPaymentInput['method'],
    amountCents,
    ...(typeof stripePaymentIntentId === 'string' && stripePaymentIntentId.trim()
      ? { stripePaymentIntentId: stripePaymentIntentId.trim() }
      : {}),
  };
}

export function parseJobCompletedBody(
  raw: unknown
): ParseJobCompletedBodyResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Invalid request body.' };
  }

  const action = (raw as { action?: unknown }).action;
  if (action !== JOB_COMPLETED_ACTION) {
    return { ok: false, error: 'Invalid action.' };
  }

  const sessionFees = parseSessionFees(
    (raw as { sessionFees?: unknown }).sessionFees
  );
  if (sessionFees === null) {
    return {
      ok: false,
      error: 'sessionFees must be an array of { label, amountCents }.',
    };
  }

  const sessionPayment = parseSessionPayment(
    (raw as { sessionPayment?: unknown }).sessionPayment
  );
  if (sessionPayment === null) {
    return {
      ok: false,
      error:
        'sessionPayment must be { method, amountCents } with method cash | payment_app | other | tap_to_pay.',
    };
  }

  return {
    ok: true,
    body: {
      action: JOB_COMPLETED_ACTION,
      sessionFees,
      ...(sessionPayment ? { sessionPayment } : {}),
    },
  };
}
