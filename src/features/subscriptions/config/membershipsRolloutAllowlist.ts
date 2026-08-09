/**
 * Temporary memberships / Subscriptions rollout allowlist (owner auth emails).
 *
 * - Non-empty + OPEN_TO_ALL false: only listed owners see dashboard Subscriptions
 *   and published plans on their public booking link.
 * - OPEN_TO_ALL true: skip the email list (all eligible Pro owners).
 * - Empty list + OPEN_TO_ALL false: feature hidden for everyone.
 *
 * Add lowercase emails as you expand the beta.
 */
export const MEMBERSHIPS_ROLLOUT_OWNER_EMAILS: readonly string[] = [
  'jesuss387@gmail.com',
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
