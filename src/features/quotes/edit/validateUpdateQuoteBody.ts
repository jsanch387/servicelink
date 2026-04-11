/**
 * Pure validation for PATCH /api/quotes/[id] (same fields as send, minus business slug).
 */

export {
  validateQuotePayloadFields as validateUpdateQuoteBody,
  type QuotePayloadInput as UpdateQuoteRequestBodyInput,
  type ValidateQuotePayloadResult as ValidateUpdateQuoteResult,
  type ValidatedQuotePayloadFields as ValidatedUpdateQuoteBody,
} from '@/features/quotes/shared/validateQuotePayloadFields';
