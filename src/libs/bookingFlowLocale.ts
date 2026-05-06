import type { PublicBookingFlowLocale } from '@/constants/routes';
import {
  DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE,
  isPublicBookingFlowLocale,
} from '@/constants/routes';

/** Normalize DB `public_booking_locales` to a stable ordered list (`en` first when present). */
export function normalizePublicBookingOfferedLocales(
  raw: string[] | null | undefined
): PublicBookingFlowLocale[] {
  const arr = Array.isArray(raw) ? raw : [];
  const filtered = arr.filter(isPublicBookingFlowLocale);
  const withEn = filtered.includes('en')
    ? filtered
    : ([...filtered, 'en'] as PublicBookingFlowLocale[]);
  const unique = [...new Set(withEn)];
  const ordered: PublicBookingFlowLocale[] = [];
  if (unique.includes('en')) ordered.push('en');
  if (unique.includes('es')) ordered.push('es');
  return ordered.length > 0 ? ordered : ['en'];
}

/**
 * Resolved locale for a specific business's public booking funnel.
 * Precedence: valid `?lang=` → valid cookie → DB default → first offered locale.
 * When only one locale is offered, it always wins (invalid query/cookie ignored).
 */
export function resolvePublicBookingFlowLocale(options: {
  offeredLocales: PublicBookingFlowLocale[];
  businessDefaultLocale: string | null | undefined;
  searchParamsLang: string | null | undefined;
  cookieValue: string | null | undefined;
}): PublicBookingFlowLocale {
  const {
    offeredLocales,
    businessDefaultLocale,
    searchParamsLang,
    cookieValue,
  } = options;

  const pickOffered = (
    loc: PublicBookingFlowLocale | null | undefined
  ): PublicBookingFlowLocale | null =>
    loc != null && offeredLocales.includes(loc) ? loc : null;

  if (offeredLocales.length === 1) {
    return offeredLocales[0]!;
  }

  const fromQuery = pickOffered(
    isPublicBookingFlowLocale(searchParamsLang) ? searchParamsLang : null
  );
  if (fromQuery) return fromQuery;

  const fromCookie = pickOffered(
    isPublicBookingFlowLocale(cookieValue) ? cookieValue : null
  );
  if (fromCookie) return fromCookie;

  const fromDb = pickOffered(
    isPublicBookingFlowLocale(businessDefaultLocale)
      ? businessDefaultLocale
      : null
  );
  if (fromDb) return fromDb;

  return offeredLocales[0] ?? DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE;
}

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
  return DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE;
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
