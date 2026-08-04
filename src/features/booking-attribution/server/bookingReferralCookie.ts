/**
 * Server-only helpers for booking referral attribution.
 *
 * Middleware turns `?ref=<source>` on a public profile URL into a first-party
 * cookie, then booking APIs read that cookie back. Attribution is never taken
 * from a request body so a client cannot label its own booking.
 */

import { BOOKING_REFERRAL_QUERY } from '@/constants/routes';
import { NextResponse, type NextRequest } from 'next/server';
import {
  BOOKING_REFERRAL_COOKIE_MAX_AGE_SECONDS,
  BOOKING_REFERRAL_COOKIE_NAME,
  type BookingReferralSource,
} from '../constants';
import {
  decodeBookingReferralCookie,
  encodeBookingReferralCookie,
  normalizeBookingReferralSlug,
  parseBookingReferralSource,
} from '../utils/bookingReferralCookieValue';

const NON_PROFILE_PATH_SEGMENTS = new Set([
  'api',
  '_next',
  'auth',
  'dashboard',
  'find-detailers',
  'login',
  'resources',
  'signup',
  'workshop',
]);

/** First path segment of `/{business-slug}` and `/{business-slug}/book`. */
function businessSlugFromPathname(pathname: string): string | null {
  const [segment] = pathname.split('/').filter(Boolean);
  if (!segment) return null;

  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    return null;
  }

  const slug = normalizeBookingReferralSlug(decoded);
  if (!slug || NON_PROFILE_PATH_SEGMENTS.has(slug)) return null;
  return slug;
}

/**
 * Returns a redirect that stores the referral and drops `?ref=` from the URL,
 * or null when the request carries nothing to attribute. Middleware only.
 */
export function bookingReferralCaptureRedirect(
  request: NextRequest
): NextResponse | null {
  if (request.method !== 'GET') return null;

  const url = request.nextUrl;
  if (!url.searchParams.has(BOOKING_REFERRAL_QUERY)) return null;

  const source = parseBookingReferralSource(
    url.searchParams.get(BOOKING_REFERRAL_QUERY)
  );
  const businessSlug = businessSlugFromPathname(url.pathname);

  const cleanUrl = url.clone();
  cleanUrl.searchParams.delete(BOOKING_REFERRAL_QUERY);
  const response = NextResponse.redirect(cleanUrl);

  if (source && businessSlug) {
    response.cookies.set({
      name: BOOKING_REFERRAL_COOKIE_NAME,
      value: encodeBookingReferralCookie(source, businessSlug),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: BOOKING_REFERRAL_COOKIE_MAX_AGE_SECONDS,
    });
  }

  return response;
}

/**
 * Referral channel for a booking with this business, or null when the visitor
 * came directly (or the stored referral belongs to a different business).
 */
export function bookingReferralSourceForBusiness(
  request: NextRequest,
  businessSlug: string
): BookingReferralSource | null {
  const stored = decodeBookingReferralCookie(
    request.cookies.get(BOOKING_REFERRAL_COOKIE_NAME)?.value
  );
  if (!stored) return null;
  if (stored.businessSlug !== normalizeBookingReferralSlug(businessSlug)) {
    return null;
  }
  return stored.source;
}
