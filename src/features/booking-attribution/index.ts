export {
  BOOKING_REFERRAL_COOKIE_MAX_AGE_SECONDS,
  BOOKING_REFERRAL_COOKIE_NAME,
  BOOKING_REFERRAL_SOURCES,
  BOOKING_SOURCES,
  MARKETPLACE_BOOKING_REFERRAL_SOURCE,
  isBookingSource,
  type BookingReferralSource,
  type BookingSource,
} from './constants';

export {
  BOOKING_REFERRAL_SOURCE_LABELS,
  BOOKING_SOURCE_LABELS,
  bookingReferralSourceLabel,
  bookingSourceLabel,
  formatBookingOriginLabel,
} from './utils/bookingOriginLabels';

export {
  decodeBookingReferralCookie,
  encodeBookingReferralCookie,
  parseBookingReferralSource,
} from './utils/bookingReferralCookieValue';

export {
  bookingReferralCaptureRedirect,
  bookingReferralSourceForBusiness,
} from './server/bookingReferralCookie';
