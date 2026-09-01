/**
 * Persists optional timeline, optional second vehicle, and the customer ask
 * into `quotes.request_message`.
 */

export const QUOTE_REQUEST_TIMING_PREFIX = 'Preferred timing:';
export const QUOTE_REQUEST_SECOND_VEHICLE_PREFIX = 'Second vehicle:';

export function formatQuoteRequestVehicleLine(
  year: string | null | undefined,
  make: string | null | undefined,
  model: string | null | undefined
): string | null {
  const text = [year, make, model]
    .map(part => (part ?? '').trim())
    .filter(Boolean)
    .join(' ');
  return text || null;
}

/** Inbox / `service_name` until the owner picks a catalog package. */
export function quoteRequestServiceNameFromAsk(details: string): string {
  const oneLine = details.replace(/\s+/g, ' ').trim();
  if (!oneLine) return 'Quote request';
  if (oneLine.length <= 80) return oneLine;
  return `${oneLine.slice(0, 79).trimEnd()}…`;
}

export function buildQuoteRequestNote(
  details: string,
  timelineTrimmed: string | null,
  secondVehicleLine: string | null = null
): string {
  const body = details.trim();
  const headers: string[] = [];
  const t = timelineTrimmed?.trim() ?? '';
  if (t.length > 0) {
    headers.push(`${QUOTE_REQUEST_TIMING_PREFIX} ${t}`);
  }
  const second = secondVehicleLine?.trim() ?? '';
  if (second.length > 0) {
    headers.push(`${QUOTE_REQUEST_SECOND_VEHICLE_PREFIX} ${second}`);
  }
  if (headers.length === 0) return body;
  return `${headers.join('\n')}\n\n${body}`;
}
