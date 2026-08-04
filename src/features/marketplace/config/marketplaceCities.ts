export interface MarketplaceCity {
  /** URL segment, e.g. `austin-tx`. */
  slug: string;
  name: string;
  stateCode: string;
  /** Human label for UI + meta. */
  displayName: string;
  /** Query passed to marketplace search. */
  searchQuery: string;
}

/**
 * Soft-launch city allowlist. Only these get SEO city URLs + sitemap entries.
 * Expand as Pro density grows — avoid empty city pages.
 */
export const MARKETPLACE_CITIES: readonly MarketplaceCity[] = [
  {
    slug: 'austin-tx',
    name: 'Austin',
    stateCode: 'TX',
    displayName: 'Austin, TX',
    searchQuery: 'Austin, TX',
  },
  {
    slug: 'round-rock-tx',
    name: 'Round Rock',
    stateCode: 'TX',
    displayName: 'Round Rock, TX',
    searchQuery: 'Round Rock, TX',
  },
  {
    slug: 'cedar-park-tx',
    name: 'Cedar Park',
    stateCode: 'TX',
    displayName: 'Cedar Park, TX',
    searchQuery: 'Cedar Park, TX',
  },
  {
    slug: 'pflugerville-tx',
    name: 'Pflugerville',
    stateCode: 'TX',
    displayName: 'Pflugerville, TX',
    searchQuery: 'Pflugerville, TX',
  },
  {
    slug: 'georgetown-tx',
    name: 'Georgetown',
    stateCode: 'TX',
    displayName: 'Georgetown, TX',
    searchQuery: 'Georgetown, TX',
  },
  {
    slug: 'leander-tx',
    name: 'Leander',
    stateCode: 'TX',
    displayName: 'Leander, TX',
    searchQuery: 'Leander, TX',
  },
] as const;

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getMarketplaceCityBySlug(
  slug: string
): MarketplaceCity | undefined {
  const normalized = slug.trim().toLowerCase();
  return MARKETPLACE_CITIES.find(city => city.slug === normalized);
}

/** Match a typed/search location string to a published city page when possible. */
export function matchMarketplaceCity(
  location: string
): MarketplaceCity | undefined {
  const normalized = normalizeKey(location);
  if (!normalized) return undefined;

  return MARKETPLACE_CITIES.find(city => {
    const cityKey = normalizeKey(city.name);
    const displayKey = normalizeKey(city.displayName);
    const state = city.stateCode.toLowerCase();
    if (normalized === displayKey || normalized === cityKey) return true;
    if (
      normalized.includes(cityKey) &&
      (normalized.includes(` ${state}`) || normalized.endsWith(state))
    ) {
      return true;
    }
    return false;
  });
}

export function marketplaceCityTitle(city: MarketplaceCity): string {
  return `Auto Detailers in ${city.displayName} | Find Local Detailing`;
}

export function marketplaceCityDescription(
  city: MarketplaceCity,
  resultCount?: number
): string {
  const countPart =
    typeof resultCount === 'number' && resultCount > 0
      ? `Browse ${resultCount} trusted detailer${resultCount === 1 ? '' : 's'}`
      : 'Find trusted auto detailers';
  return `${countPart} in ${city.displayName}. Compare mobile and shop detailing, ratings, and book online on Service Link.`;
}
