/**
 * Master kill switch for Booking Link 2.0 (public profile redesign).
 * Flip false to hide 2.0 for every business instantly.
 */
const BOOKING_LINK_V2_ENABLED = true;

export function isBookingLinkV2Enabled(): boolean {
  return BOOKING_LINK_V2_ENABLED;
}
