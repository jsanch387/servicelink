import {
  getMarketplaceCityBySlug,
  matchMarketplaceCity,
  type MarketplaceCity,
} from '../config/marketplaceCities';
import { parseMarketplaceLocation } from './parseMarketplaceLocation';

const MAX_SLUG_LENGTH = 80;

function titleCaseWords(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Build a stable `/find-detailers/{slug}` segment from a typed location.
 * Prefers curated soft-launch slugs when the query matches.
 */
export function locationToMarketplaceSlug(location: string): string | null {
  const trimmed = location.trim();
  if (!trimmed) return null;

  const curated = matchMarketplaceCity(trimmed);
  if (curated) return curated.slug;

  const parsed = parseMarketplaceLocation(trimmed);
  if (!parsed) return null;

  if (parsed.zip && !parsed.city) return parsed.zip;

  const citySlug = (parsed.city ?? '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  if (citySlug.length < 2) return null;

  const slug = parsed.state
    ? `${citySlug}-${parsed.state.toLowerCase()}`
    : citySlug;

  if (slug.length > MAX_SLUG_LENGTH) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return slug;
}

/**
 * Resolve a city page model from a URL slug (curated or dynamic).
 */
export function resolveMarketplaceCityFromSlug(
  slug: string
): MarketplaceCity | null {
  const normalized = slug.trim().toLowerCase();
  if (!normalized || normalized.length > MAX_SLUG_LENGTH) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) return null;

  const curated = getMarketplaceCityBySlug(normalized);
  if (curated) return curated;

  if (/^\d{5}$/.test(normalized)) {
    return {
      slug: normalized,
      name: normalized,
      stateCode: '',
      displayName: normalized,
      searchQuery: normalized,
    };
  }

  const parts = normalized.split('-').filter(Boolean);
  if (parts.length === 0) return null;

  const last = parts[parts.length - 1]!;
  if (parts.length >= 2 && /^[a-z]{2}$/.test(last)) {
    const stateCode = last.toUpperCase();
    const name = titleCaseWords(parts.slice(0, -1).join(' '));
    if (name.replace(/\s/g, '').length < 2) return null;
    return {
      slug: normalized,
      name,
      stateCode,
      displayName: `${name}, ${stateCode}`,
      searchQuery: `${name}, ${stateCode}`,
    };
  }

  const name = titleCaseWords(parts.join(' '));
  if (name.replace(/\s/g, '').length < 2) return null;
  return {
    slug: normalized,
    name,
    stateCode: '',
    displayName: name,
    searchQuery: name,
  };
}

export function isCuratedMarketplaceCitySlug(slug: string): boolean {
  return Boolean(getMarketplaceCityBySlug(slug.trim().toLowerCase()));
}
