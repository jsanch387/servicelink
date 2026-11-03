import type { StructuredLocation } from '../types/location';

const DIRECTION: Record<string, string> = {
  n: 'north',
  s: 'south',
  e: 'east',
  w: 'west',
  ne: 'northeast',
  nw: 'northwest',
  se: 'southeast',
  sw: 'southwest',
};

const STREET_SUFFIX: Record<string, string> = {
  ave: 'avenue',
  av: 'avenue',
  st: 'street',
  rd: 'road',
  dr: 'drive',
  blvd: 'boulevard',
  ln: 'lane',
  ct: 'court',
  hwy: 'highway',
  pkwy: 'parkway',
  cir: 'circle',
  ter: 'terrace',
  pl: 'place',
};

const GENERIC_TOKENS = new Set([
  'street',
  'avenue',
  'road',
  'drive',
  'boulevard',
  'lane',
  'court',
  'highway',
  'parkway',
  'circle',
  'terrace',
  'place',
  'north',
  'south',
  'east',
  'west',
  'northeast',
  'northwest',
  'southeast',
  'southwest',
  'interstate',
  'service',
  'nb',
  'sb',
  'eb',
  'wb',
]);

function typedHouseNumber(query: string): { house: string; rest: string } | null {
  const match = query.trim().match(/^(\d+[a-zA-Z]?)\s+(.+)$/);
  if (!match) return null;
  return { house: match[1], rest: match[2] };
}

/** Spell out highway shorthand so MapTiler can match "IH 35" to Interstate 35. */
export function expandStreetAddressQuery(query: string): string {
  return query
    .trim()
    .replace(/\bih\b/gi, 'Interstate')
    .replace(/\bi-(\d+)\b/gi, 'Interstate $1')
    .replace(/\bhwy\b/gi, 'Highway')
    .replace(/\b(ne|nw|se|sw|n|s|e|w)\b/gi, token => {
      const word = DIRECTION[token.toLowerCase()];
      if (!word) return token;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .replace(/\s+/g, ' ')
    .trim();
}

export function streetAddressQueryVariants(query: string): string[] {
  const trimmed = query.trim();
  const expanded = expandStreetAddressQuery(trimmed);
  if (!trimmed) return [];
  if (expanded.toLowerCase() === trimmed.toLowerCase()) return [trimmed];
  return [trimmed, expanded];
}

function streetTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[.,#]/g, ' ')
    .replace(/\b(i|ih|interstate)\s*-?\s*(\d+)\b/g, 'interstate $2')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(token => STREET_SUFFIX[token] ?? DIRECTION[token] ?? token);
}

function significantTokens(tokens: string[]): string[] {
  const significant = tokens.filter(token => !GENERIC_TOKENS.has(token));
  return significant.length > 0 ? significant : tokens;
}

function streetMatchesRemainder(street: string, remainder: string): boolean {
  const streetSignificant = significantTokens(streetTokens(street));
  const querySignificant = significantTokens(streetTokens(remainder));
  if (querySignificant.length === 0 || streetSignificant.length === 0) {
    return false;
  }
  return querySignificant.every(token => streetSignificant.includes(token));
}

function cityStateZip(location: StructuredLocation): string {
  const cityState = `${location.city}, ${location.state}`;
  return location.zip ? `${cityState} ${location.zip}` : cityState;
}

/**
 * MapTiler often returns the road ("Burkemont Avenue") and drops the house
 * number the owner typed. Keep that number on the suggestion they can select.
 */
export function withTypedHouseNumber(
  query: string,
  location: StructuredLocation
): StructuredLocation {
  const typed = typedHouseNumber(query);
  const street = location.street?.trim() ?? '';
  if (!typed || !street) return location;
  if (street.toLowerCase().startsWith(`${typed.house.toLowerCase()} `)) {
    return location;
  }
  if (!streetMatchesRemainder(street, typed.rest)) return location;

  const nextStreet = `${typed.house} ${street}`;
  const label = `${nextStreet}, ${cityStateZip(location)}`;
  return {
    ...location,
    street: nextStreet,
    label,
    searchValue: label,
  };
}

function streetHasTypedHouse(street: string, house: string): boolean {
  return street.toLowerCase().startsWith(`${house.toLowerCase()} `);
}

export function rankStreetAddressSuggestions(
  query: string,
  locations: StructuredLocation[]
): StructuredLocation[] {
  const typed = typedHouseNumber(query);
  const providerNumbered = typed
    ? locations.filter(location =>
        streetHasTypedHouse(location.street ?? '', typed.house)
      )
    : [];
  // Keep a provider house number when one exists. Only fill in the typed
  // number when every match is a road with no number, like Burkemont Avenue.
  const source = providerNumbered.length > 0 ? providerNumbered : locations;
  const prepared = source.map((location, index) => ({
    location:
      providerNumbered.length > 0
        ? location
        : withTypedHouseNumber(query, location),
    index,
  }));

  const matching = typed
    ? prepared.filter(item =>
        streetMatchesRemainder(item.location.street ?? '', typed.rest)
      )
    : prepared;
  const pool = matching.length > 0 ? matching : prepared;

  const remainder = typed?.rest ?? query;
  const queryTokens = significantTokens(streetTokens(remainder));

  return pool
    .map(item => {
      const street = item.location.street ?? '';
      const tokens = streetTokens(street);
      const significant = significantTokens(tokens);
      const overlap = queryTokens.filter(token =>
        significant.includes(token)
      ).length;
      const queryTokenSet = new Set(streetTokens(remainder));
      const extras = tokens.filter(token => !queryTokenSet.has(token)).length;
      const hasHouse = typed
        ? streetHasTypedHouse(street, typed.house)
        : false;
      const score = (hasHouse ? 100 : 0) + overlap * 10 - extras * 3;
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 5)
    .map(item => item.location);
}
