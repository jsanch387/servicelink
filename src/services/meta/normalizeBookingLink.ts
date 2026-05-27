const APP_DOMAIN = 'myservicelink.app';

/**
 * Returns a canonical https booking URL from `business_link` or `business_slug`.
 * Never invent slugs — only normalizes stored values.
 */
export function normalizeBookingLink(
  businessLink: string | null | undefined,
  businessSlug: string | null | undefined
): string | null {
  const trimmedLink = businessLink?.trim();
  if (trimmedLink) {
    if (/^https:\/\//i.test(trimmedLink)) {
      return trimmedLink;
    }
    if (/^http:\/\//i.test(trimmedLink)) {
      return trimmedLink.replace(/^http:\/\//i, 'https://');
    }
    return `https://${trimmedLink.replace(/^\/+/, '')}`;
  }

  const slug = businessSlug?.trim();
  if (!slug) {
    return null;
  }

  return `https://${APP_DOMAIN}/${slug}`;
}
