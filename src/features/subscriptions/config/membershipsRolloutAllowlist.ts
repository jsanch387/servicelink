/**
 * Temporary memberships / Subscriptions rollout allowlist (owner auth emails).
 *
 * - Non-empty + OPEN_TO_ALL false: only listed owners see dashboard Subscriptions
 *   and published plans on their public booking link.
 * - OPEN_TO_ALL true: skip the email list (all eligible Pro owners).
 * - Empty list + OPEN_TO_ALL false: feature hidden for everyone.
 *
 * Add lowercase emails as you expand the beta.
 * Keep this tight until live BA testing looks good.
 */
export const MEMBERSHIPS_ROLLOUT_OWNER_EMAILS: readonly string[] = [
  // Primary (prod soft-launch testing)
  'jesuss387@gmail.com',
  // Existing test accounts
  'ask.mento@gmail.com',
  'urbanink.help@gmail.com',
  // Beta owners
  'josesdetailingbusiness@gmail.com', // Ride Fresh Detailing
  'bermejojoshua183@gmail.com', // J & DD'S Auto Detailing
  'amluxedetailing@gmail.com', // AMLuxe Detailing LLC
  'mobilecardetailinggr@gmail.com', // G&R Mobile Detailing
  'elev8tedetailing@icloud.com', // Elev8te
  'dav414@icloud.com', // Omega Auto Detailing
  'archivedetail@gmail.com', // Archive Detailing
  'erickjavier1355@icloud.com',
];

/** Set true to open memberships to all eligible owners (ignores the email list). */
export const MEMBERSHIPS_ROLLOUT_OPEN_TO_ALL = false;

export function isMembershipsRolloutAllowlistActive(): boolean {
  return (
    !MEMBERSHIPS_ROLLOUT_OPEN_TO_ALL &&
    MEMBERSHIPS_ROLLOUT_OWNER_EMAILS.length > 0
  );
}

export function isOwnerEmailAllowedForMembershipsRollout(
  email: string | null | undefined
): boolean {
  if (MEMBERSHIPS_ROLLOUT_OPEN_TO_ALL) return true;
  if (MEMBERSHIPS_ROLLOUT_OWNER_EMAILS.length === 0) return false;

  const normalized = email?.trim().toLowerCase() ?? '';
  if (!normalized) return false;
  return MEMBERSHIPS_ROLLOUT_OWNER_EMAILS.some(
    entry => entry.toLowerCase() === normalized
  );
}
