import type { PublicBookingFlowLocale } from '@/constants/routes';
import { isPublicBookingFlowLocale } from '@/constants/routes';

/** Cookie scoped to `/` so it applies to `/{slug}` and `/book` without path hacks. */
export const BOOKING_FLOW_LOCALE_COOKIE_NAME = 'sl_booking_lang';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Funnel locale: explicit `?lang=` beats cookie; otherwise cookie; default English.
 */
export function resolveBookingFlowLocale(
  searchParamsLang: string | undefined | null,
  cookieValue: string | undefined | null
): PublicBookingFlowLocale {
  if (isPublicBookingFlowLocale(searchParamsLang)) {
    return searchParamsLang;
  }
  if (isPublicBookingFlowLocale(cookieValue)) {
    return cookieValue;
  }
  return 'en';
}

/** Client: read persisted funnel locale (may be null if unset / invalid). */
export function readBookingFlowLocaleFromDocument(): PublicBookingFlowLocale | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${BOOKING_FLOW_LOCALE_COOKIE_NAME}=`;
  const row = document.cookie.split('; ').find(r => r.startsWith(prefix));
  if (!row) return null;
  const value = row.slice(prefix.length);
  return isPublicBookingFlowLocale(value) ? value : null;
}

/** Client: persist after user picks a language on the profile or in the funnel. */
export function writeBookingFlowLocaleCookie(
  locale: PublicBookingFlowLocale
): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${BOOKING_FLOW_LOCALE_COOKIE_NAME}=${locale};path=/;max-age=${ONE_YEAR_SECONDS};samesite=lax`;
}
