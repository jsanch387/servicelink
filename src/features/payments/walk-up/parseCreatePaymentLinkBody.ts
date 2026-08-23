import {
  WALKUP_PAYMENT_CURRENCY,
  WALKUP_PAYMENT_MAX_AMOUNT_CENTS,
  WALKUP_PAYMENT_MIN_AMOUNT_CENTS,
  WALKUP_PAYMENT_NOTE_MAX_LENGTH,
} from './constants';

export interface CreatePaymentLinkRequestBody {
  amountCents: number;
  currency: typeof WALKUP_PAYMENT_CURRENCY;
  note: string;
}

export type ParseCreatePaymentLinkBodyResult =
  | { ok: true; body: CreatePaymentLinkRequestBody }
  | { ok: false; error: string };

function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function parseCreatePaymentLinkBody(
  raw: unknown
): ParseCreatePaymentLinkBodyResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Invalid request body.' };
  }

  const payload = raw as Record<string, unknown>;
  const amountRaw = payload.amountCents;
  if (
    typeof amountRaw !== 'number' ||
    !Number.isInteger(amountRaw) ||
    amountRaw <= 0
  ) {
    return { ok: false, error: 'Enter an amount greater than $0.' };
  }

  if (amountRaw < WALKUP_PAYMENT_MIN_AMOUNT_CENTS) {
    return {
      ok: false,
      error: `Amount must be at least ${formatUsd(WALKUP_PAYMENT_MIN_AMOUNT_CENTS)}.`,
    };
  }

  if (amountRaw > WALKUP_PAYMENT_MAX_AMOUNT_CENTS) {
    return {
      ok: false,
      error: `Amount can't be more than ${formatUsd(WALKUP_PAYMENT_MAX_AMOUNT_CENTS)}.`,
    };
  }

  const currencyRaw =
    typeof payload.currency === 'string'
      ? payload.currency.trim().toLowerCase()
      : WALKUP_PAYMENT_CURRENCY;
  if (currencyRaw !== WALKUP_PAYMENT_CURRENCY) {
    return { ok: false, error: 'Only USD payments are supported.' };
  }

  const note =
    typeof payload.note === 'string' ? payload.note.trim() : '';
  if (!note) {
    return {
      ok: false,
      error: 'Add a short note for what this payment is for.',
    };
  }
  if (note.length > WALKUP_PAYMENT_NOTE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Note must be ${WALKUP_PAYMENT_NOTE_MAX_LENGTH} characters or fewer.`,
    };
  }

  return {
    ok: true,
    body: {
      amountCents: amountRaw,
      currency: WALKUP_PAYMENT_CURRENCY,
      note,
    },
  };
}
