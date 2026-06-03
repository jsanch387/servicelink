import { getPublicReviewPath } from '@/constants/routes';

/** Full URL for the customer review form (client-safe). */
export function buildReviewInviteCustomerUrl(rawToken: string): string {
  const token = rawToken.trim();
  if (!token) return '';
  const path = getPublicReviewPath(token);
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  const base = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  return base ? `${base}${path}` : path;
}
