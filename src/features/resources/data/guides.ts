/**
 * List of resource guides. Used for the Resources index and for resolving /resources/[slug].
 * Add new guides here; each needs a unique slug for the URL.
 * metaDescription is used for SEO (title/meta/OG); keep it under ~160 characters.
 */
export interface GuideMeta {
  slug: string;
  title: string;
  subheading: string;
  /** Optional SEO meta description; falls back to subheading if not set. */
  metaDescription?: string;
  /** Optional ISO date for Article schema (e.g. "2026-01-15"). */
  datePublished?: string;
  /** Optional ISO date for Article schema; defaults to datePublished if not set. */
  dateModified?: string;
}

export const GUIDES: GuideMeta[] = [
  {
    slug: 'how-mobile-detailers-get-clients-from-instagram-2026',
    title: 'How Mobile Detailers Get Clients From Instagram (2026 Guide)',
    subheading:
      'Learn how to get new bookings from Instagram and TikTok with the right videos and a simple booking link—no big following required.',
    metaDescription:
      'Learn how mobile car detailers get clients from Instagram and TikTok. Best detailing videos, local SEO tips, and a free booking link to turn viewers into customers.',
    datePublished: '2026-01-15',
    dateModified: '2026-01-15',
  },
];

export function getGuideBySlug(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
