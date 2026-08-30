const BOOKING_POLICY_AGREED_STORAGE_PREFIX = 'booking-policy-agreed:';

export function bookingPolicyAgreedStorageKey(businessSlug: string): string {
  return `${BOOKING_POLICY_AGREED_STORAGE_PREFIX}${businessSlug}`;
}

export function hasAgreedToPublicBookingPolicy(businessSlug: string): boolean {
  if (typeof window === 'undefined' || !businessSlug.trim()) return false;
  try {
    return (
      sessionStorage.getItem(bookingPolicyAgreedStorageKey(businessSlug)) ===
      '1'
    );
  } catch {
    return false;
  }
}

export function markPublicBookingPolicyAgreed(businessSlug: string): void {
  if (typeof window === 'undefined' || !businessSlug.trim()) return;
  try {
    sessionStorage.setItem(bookingPolicyAgreedStorageKey(businessSlug), '1');
  } catch {
    // quota / private mode
  }
}
