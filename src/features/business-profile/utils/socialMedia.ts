/**
 * Social media helpers for profile edit + public booking link.
 * Store normalized handles; build HTTPS profile URLs at render time.
 */

export type SocialPlatform = 'instagram' | 'tiktok';

export type BusinessSocialMedia = {
  instagram?: string;
  tiktok?: string;
};

const HANDLE_PATTERN = /^[A-Za-z0-9._]{1,64}$/;

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

function readHandle(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

/** Read stored `social_media` JSON into form-friendly handles. */
export function parseSocialMedia(raw: unknown): BusinessSocialMedia {
  const record = asRecord(raw);
  if (!record) return {};

  const instagram = normalizeSocialInput(
    'instagram',
    readHandle(record.instagram) ?? ''
  );
  const tiktok = normalizeSocialInput(
    'tiktok',
    readHandle(record.tiktok) ?? ''
  );

  return {
    ...(instagram ? { instagram } : {}),
    ...(tiktok ? { tiktok } : {}),
  };
}

/**
 * Accepts `@handle` or a profile URL; returns bare handle or '' if empty/invalid.
 */
export function normalizeSocialInput(
  platform: SocialPlatform,
  raw: string
): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const fromUrl = extractHandleFromUrl(platform, trimmed);
  const candidate = (fromUrl ?? trimmed).replace(/^@+/, '').trim();
  if (!candidate || !HANDLE_PATTERN.test(candidate)) return '';
  return candidate;
}

function extractHandleFromUrl(
  platform: SocialPlatform,
  value: string
): string | null {
  let url: URL;
  try {
    const withProtocol = /^https?:\/\//i.test(value)
      ? value
      : `https://${value}`;
    url = new URL(withProtocol);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, '').toLowerCase();
  const segment = url.pathname.split('/').filter(Boolean)[0] ?? '';
  if (!segment) return null;

  if (platform === 'instagram') {
    if (host !== 'instagram.com' && host !== 'instagr.am') return null;
    return segment.replace(/^@+/, '');
  }

  if (
    host !== 'tiktok.com' &&
    host !== 'www.tiktok.com' &&
    host !== 'vm.tiktok.com'
  ) {
    return null;
  }
  return segment.replace(/^@+/, '');
}

/** Canonical HTTPS URL for opening the app or browser. */
export function socialProfileUrl(
  platform: SocialPlatform,
  handle: string
): string | null {
  const normalized = normalizeSocialInput(platform, handle);
  if (!normalized) return null;

  if (platform === 'instagram') {
    return `https://instagram.com/${normalized}`;
  }
  return `https://www.tiktok.com/@${normalized}`;
}

/** Shape to persist on `business_profiles.social_media`. */
export function socialMediaForPersist(input: {
  instagram: string;
  tiktok: string;
}): BusinessSocialMedia {
  const instagram = normalizeSocialInput('instagram', input.instagram);
  const tiktok = normalizeSocialInput('tiktok', input.tiktok);

  return {
    ...(instagram ? { instagram } : {}),
    ...(tiktok ? { tiktok } : {}),
  };
}

export function socialLinksForDisplay(
  raw: unknown
): Array<{ id: SocialPlatform; label: string; href: string }> {
  const parsed = parseSocialMedia(raw);
  const links: Array<{ id: SocialPlatform; label: string; href: string }> = [];

  const instagramHref = parsed.instagram
    ? socialProfileUrl('instagram', parsed.instagram)
    : null;
  if (instagramHref) {
    links.push({ id: 'instagram', label: 'Instagram', href: instagramHref });
  }

  const tiktokHref = parsed.tiktok
    ? socialProfileUrl('tiktok', parsed.tiktok)
    : null;
  if (tiktokHref) {
    links.push({ id: 'tiktok', label: 'TikTok', href: tiktokHref });
  }

  return links;
}
