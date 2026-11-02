import type { BookingReferralSource, BookingSource } from '../constants';
import { isBookingSource } from '../constants';
import { parseBookingReferralSource } from './bookingReferralCookieValue';

export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
  owner: 'Owner created',
  public: 'Booking link',
  quote: 'Quote',
  subscription: 'Subscription',
};

export const BOOKING_REFERRAL_SOURCE_LABELS: Record<
  BookingReferralSource,
  string
> = {
  marketplace: 'Find detailers',
};

export function bookingSourceLabel(
  source: string | null | undefined
): string | null {
  return isBookingSource(source) ? BOOKING_SOURCE_LABELS[source] : null;
}

export function bookingReferralSourceLabel(
  referral: string | null | undefined
): string | null {
  const parsed = parseBookingReferralSource(referral);
  return parsed ? BOOKING_REFERRAL_SOURCE_LABELS[parsed] : null;
}

/** e.g. "Quote · Find detailers" or "Booking link". */
export function formatBookingOriginLabel(
  source: string | null | undefined,
  referral: string | null | undefined
): string | null {
  const origin = bookingSourceLabel(source);
  if (!origin) return null;
  const channel = bookingReferralSourceLabel(referral);
  return channel ? `${origin} · ${channel}` : origin;
}
