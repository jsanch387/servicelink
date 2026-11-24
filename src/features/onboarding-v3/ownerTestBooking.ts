/** First-party cookie set before the owner opens their own booking page. */
export const OWNER_TEST_BOOKING_COOKIE = 'sl_owner_test';

export function markOwnerTestBookingCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${OWNER_TEST_BOOKING_COOKIE}=1; path=/; max-age=3600; samesite=lax`;
}
