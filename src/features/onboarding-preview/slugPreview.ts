import { SLUG_MAX_LENGTH, sanitizeSlugInput } from '@/constants/slug';

/** Design-only taken slugs so the suggestion state can be reviewed. */
const TAKEN_SLUGS = new Set([
  'detailing',
  'shop',
  'mike',
  'servicelink',
  'link',
  'test',
]);

export const BOOKING_LINK_HOST = 'myservicelink.app';

/**
 * Auto link from a business name. Spaces and punctuation are removed
 * so "Mike's Detailing" becomes mikesdetailing.
 */
export function slugFromBusinessName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, SLUG_MAX_LENGTH);
}

export function suggestFreeSlug(slug: string): string {
  const base = slug.replace(/[^a-z0-9]/g, '') || 'shop';
  for (let n = 2; n < 50; n += 1) {
    const suffix = String(n);
    const candidate = `${base.slice(0, SLUG_MAX_LENGTH - suffix.length)}${suffix}`;
    if (!TAKEN_SLUGS.has(candidate)) return candidate;
  }
  return `${base.slice(0, SLUG_MAX_LENGTH - 1)}2`;
}

export type SlugPreviewResult =
  | { state: 'idle' }
  | { state: 'free'; slug: string }
  | { state: 'taken'; typed: string; suggestion: string };

export function resolvePreviewSlug(raw: string): SlugPreviewResult {
  const slug = sanitizeSlugInput(raw).replace(/^-+|-+$/g, '');
  if (slug.length < 3) return { state: 'idle' };
  if (TAKEN_SLUGS.has(slug)) {
    return { state: 'taken', typed: slug, suggestion: suggestFreeSlug(slug) };
  }
  return { state: 'free', slug };
}

export function bookingLinkLabel(slug: string): string {
  return `${BOOKING_LINK_HOST}/${slug}`;
}
