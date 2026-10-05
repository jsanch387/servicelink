/**
 * Pure validation for POST /api/quotes/send (before DB / auth-specific checks).
 */

import {
  parseQuotePaymentCollection,
  type QuotePaymentCollection,
} from '@/features/quotes/shared/quotePaymentCollection';
import type { ValidatedQuotePayloadFields } from '@/features/quotes/shared/validateQuotePayloadFields';
import {
  validateQuotePayloadFields,
  type QuotePayloadInput,
} from '@/features/quotes/shared/validateQuotePayloadFields';

export interface SendQuoteRequestBodyInput extends QuotePayloadInput {
  businessSlug?: string;
  paymentCollection?: string;
}

export type ValidatedSendQuoteBody = ValidatedQuotePayloadFields & {
  businessSlug: string;
  paymentCollection: QuotePaymentCollection;
};

export type ValidateSendQuoteResult =
  | { ok: true; data: ValidatedSendQuoteBody }
  | { ok: false; error: string; status: number };

export {
  normalizeOptionalPhoneDigits,
  toTimeWithSeconds,
} from '@/features/quotes/shared/validateQuotePayloadFields';

export function validateSendQuoteBody(raw: unknown): ValidateSendQuoteResult {
  const body = raw as SendQuoteRequestBodyInput;

  if (!body?.businessSlug?.trim()) {
    return {
      ok: false,
      error: 'Business slug is required',
      status: 400,
    };
  }

  const core = validateQuotePayloadFields(body);
  if (!core.ok) return core;

  const paymentCollection = parseQuotePaymentCollection(body.paymentCollection);
  if (!paymentCollection) {
    return {
      ok: false,
      error: 'Choose how the customer pays for this quote',
      status: 400,
    };
  }

  return {
    ok: true,
    data: {
      ...core.data,
      businessSlug: body.businessSlug.trim(),
      paymentCollection,
    },
  };
}
