/**
 * How the appointment row was created. Server-set only — never from a
 * client body. Marketplace is not a source; it is a `referral_source` that
 * can sit on a public booking or a quote-converted booking.
 */
export const BOOKING_SOURCES = [
  'owner',
  'public',
  'quote',
  'subscription',
] as const;

export type BookingSource = (typeof BOOKING_SOURCES)[number];

export function isBookingSource(
  value: string | null | undefined
): value is BookingSource {
  return (
    typeof value === 'string' &&
    (BOOKING_SOURCES as readonly string[]).includes(value)
  );
}

/** Channels that can send a customer to a public business profile. */
export const BOOKING_REFERRAL_SOURCES = ['marketplace'] as const;

export type BookingReferralSource = (typeof BOOKING_REFERRAL_SOURCES)[number];

/** Value used on `/find-detailers` listing links; see `BOOKING_REFERRAL_QUERY`. */
export const MARKETPLACE_BOOKING_REFERRAL_SOURCE: BookingReferralSource =
  'marketplace';

/** First-party cookie holding `<source>:<business-slug>`. */
export const BOOKING_REFERRAL_COOKIE_NAME = 'sl_booking_ref';

/** Customers often browse the marketplace days before they actually book. */
export const BOOKING_REFERRAL_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export const BOOKING_REFERRAL_COOKIE_SEPARATOR = ':';
