import type { DashboardQuote } from '../types';

/** Single-line service location from structured fields or legacy line. */
export function formatQuoteRequestServiceLocation(
  q: DashboardQuote
): string | null {
  const cityStateZip = [q.serviceCity, q.serviceState, q.serviceZip]
    .filter(Boolean)
    .join(', ')
    .trim();
  const parts = [q.serviceStreet?.trim() || '', cityStateZip].filter(
    p => p.length > 0
  );
  const line = parts.join(', ').trim();
  if (line.length > 0) return line;
  const legacy = q.serviceAddressLine?.trim();
  return legacy && legacy.length > 0 ? legacy : null;
}
