import {
  BOOKING_REFERRAL_COOKIE_SEPARATOR,
  BOOKING_REFERRAL_SOURCES,
  type BookingReferralSource,
} from '../constants';

export function normalizeBookingReferralSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Anything not in the allow-list is dropped, so a crafted URL cannot invent a channel. */
export function parseBookingReferralSource(
  raw: unknown
): BookingReferralSource | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim().toLowerCase();
  return BOOKING_REFERRAL_SOURCES.find(source => source === value) ?? null;
}

/**
 * The slug is stored alongside the source so a marketplace visit to one detailer
 * cannot be credited to a booking the customer later makes with another.
 */
export function encodeBookingReferralCookie(
  source: BookingReferralSource,
  businessSlug: string
): string {
  return `${source}${BOOKING_REFERRAL_COOKIE_SEPARATOR}${normalizeBookingReferralSlug(businessSlug)}`;
}

export function decodeBookingReferralCookie(
  raw: string | undefined | null
): { source: BookingReferralSource; businessSlug: string } | null {
  if (!raw) return null;
  const separatorIndex = raw.indexOf(BOOKING_REFERRAL_COOKIE_SEPARATOR);
  if (separatorIndex < 1) return null;

  const source = parseBookingReferralSource(raw.slice(0, separatorIndex));
  const businessSlug = normalizeBookingReferralSlug(
    raw.slice(separatorIndex + 1)
  );
  if (!source || !businessSlug) return null;

  return { source, businessSlug };
}
