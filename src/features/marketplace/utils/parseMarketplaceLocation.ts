/**
 * Shared marketplace location parsing (hub search, city slugs, server search).
 */

export const MARKETPLACE_MAX_LOCATION_LENGTH = 100;

export interface ParsedMarketplaceLocation {
  display: string;
  city: string | null;
  state: string | null;
  zip: string | null;
}

function normalizeWords(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseMarketplaceLocation(
  value: string
): ParsedMarketplaceLocation | null {
  const display = value.replace(/\s+/g, ' ').trim();
  if (!display || display.length > MARKETPLACE_MAX_LOCATION_LENGTH) return null;

  const zip = display.match(/\b\d{5}\b/)?.[0] ?? null;
  if (zip && /^\d{5}$/.test(display)) {
    return { display, city: null, state: null, zip };
  }

  const [beforeComma = '', afterComma = ''] = display.split(',');
  const cityCandidate = beforeComma || display;
  const state =
    afterComma
      .trim()
      .match(/^([a-z]{2})\b/i)?.[1]
      ?.toUpperCase() ??
    display.match(/\s([a-z]{2})$/i)?.[1]?.toUpperCase() ??
    null;
  const city = normalizeWords(
    cityCandidate.replace(/\s+[a-z]{2}$/i, '').trim()
  );

  if (city.length < 2 || city === 'current location') return null;
  return { display, city, state, zip };
}
