import { getPublicMaintenanceEnrollmentPath } from '@/constants/routes';

/** Full URL for the public maintenance enrollment page (client-safe). */
export function buildMaintenanceInviteCustomerUrl(rawToken: string): string {
  const token = rawToken.trim();
  if (!token) return '';
  const path = getPublicMaintenanceEnrollmentPath(token);
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  const base = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  return base ? `${base}${path}` : path;
}
