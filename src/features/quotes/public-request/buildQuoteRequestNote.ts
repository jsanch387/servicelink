/**
 * Persists optional timeline and the customer ask into `quotes.request_message`.
 * Assets live on `quotes.assets` (first vehicle also on vehicle_year/make/model).
 */

import { formatQuoteVehicleLine } from '@/features/quotes/shared/quoteAssets';

export const QUOTE_REQUEST_TIMING_PREFIX = 'Preferred timing:';
/** @deprecated Old rows only. New requests store extra items on `quotes.assets`. */
export const QUOTE_REQUEST_SECOND_VEHICLE_PREFIX = 'Second vehicle:';

export const formatQuoteRequestVehicleLine = formatQuoteVehicleLine;

/** Inbox / `service_name` until the owner picks a catalog package. */
export function quoteRequestServiceNameFromAsk(details: string): string {
  const oneLine = details.replace(/\s+/g, ' ').trim();
  if (!oneLine) return 'Quote request';
  if (oneLine.length <= 80) return oneLine;
  return `${oneLine.slice(0, 79).trimEnd()}…`;
}

export function buildQuoteRequestNote(
  details: string,
  timelineTrimmed: string | null
): string {
  const body = details.trim();
  const t = timelineTrimmed?.trim() ?? '';
  if (!t) return body;
  return `${QUOTE_REQUEST_TIMING_PREFIX} ${t}\n\n${body}`;
}
