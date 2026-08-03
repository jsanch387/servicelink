export {
  BOOKING_REFERRAL_COOKIE_MAX_AGE_SECONDS,
  BOOKING_REFERRAL_COOKIE_NAME,
  BOOKING_REFERRAL_SOURCES,
  MARKETPLACE_BOOKING_REFERRAL_SOURCE,
  type BookingReferralSource,
} from './constants';

export {
  decodeBookingReferralCookie,
  encodeBookingReferralCookie,
  parseBookingReferralSource,
} from './utils/bookingReferralCookieValue';

export {
  bookingReferralCaptureRedirect,
  bookingReferralSourceForBusiness,
} from './server/bookingReferralCookie';
