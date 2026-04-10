/**
 * Customer-submitted request body text for parsing (timeline + details).
 * New rows store this in `quotes.request_message`. Legacy rows used `note`.
 */
export function resolveCustomerRequestRawText(quote: {
  source: string;
  requestMessage: string | null;
  note: string | null;
}): string {
  if (quote.source !== 'customer_requested') return '';
  const rm = quote.requestMessage?.trim() ?? '';
  if (rm.length > 0) return rm;
  return quote.note?.trim() ?? '';
}
