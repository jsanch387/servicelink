/**
 * Pure validation for POST /api/quotes/send (before DB / auth-specific checks).
 */

import type { ValidatedQuotePayloadFields } from '@/features/quotes/shared/validateQuotePayloadFields';
import {
  validateQuotePayloadFields,
  type QuotePayloadInput,
} from '@/features/quotes/shared/validateQuotePayloadFields';

export interface SendQuoteRequestBodyInput extends QuotePayloadInput {
  businessSlug?: string;
}

export type ValidatedSendQuoteBody = ValidatedQuotePayloadFields & {
  businessSlug: string;
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

  return {
    ok: true,
    data: {
      ...core.data,
      businessSlug: body.businessSlug.trim(),
    },
  };
}
