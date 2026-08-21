/**
 * Temporary Booking Link 2.0 rollout allowlist (owner auth emails).
 *
 * - Non-empty + OPEN_TO_ALL false: only listed owners get the 2.0 public profile.
 * - OPEN_TO_ALL true: skip the email list (all businesses).
 * - Empty list + OPEN_TO_ALL false: 2.0 hidden unless ?v2=1 preview override.
 *
 * Add lowercase emails as you expand the beta.
 */
export const BOOKING_LINK_V2_ROLLOUT_OWNER_EMAILS: readonly string[] = [
  'jesuss387@gmail.com',
  'ask.mento@gmail.com',
  'urbanink.help@gmail.com',
];

/** Set true to open Booking Link 2.0 to every business (ignores the email list). */
export const BOOKING_LINK_V2_ROLLOUT_OPEN_TO_ALL = false;

export function isBookingLinkV2RolloutAllowlistActive(): boolean {
  return (
    !BOOKING_LINK_V2_ROLLOUT_OPEN_TO_ALL &&
    BOOKING_LINK_V2_ROLLOUT_OWNER_EMAILS.length > 0
  );
}

export function isOwnerEmailAllowedForBookingLinkV2Rollout(
  email: string | null | undefined
): boolean {
  if (BOOKING_LINK_V2_ROLLOUT_OPEN_TO_ALL) return true;
  if (BOOKING_LINK_V2_ROLLOUT_OWNER_EMAILS.length === 0) return false;

  const normalized = email?.trim().toLowerCase() ?? '';
  if (!normalized) return false;
  return BOOKING_LINK_V2_ROLLOUT_OWNER_EMAILS.some(
    entry => entry.toLowerCase() === normalized
  );
}
