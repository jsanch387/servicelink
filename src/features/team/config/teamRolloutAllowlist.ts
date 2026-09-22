/**
 * Temporary Team nav rollout (owner auth emails).
 *
 * - OPEN_TO_ALL true: every owner sees Team (unlock later).
 * - Non-empty + OPEN_TO_ALL false: only listed owners see the Team tab.
 * - Empty list + OPEN_TO_ALL false: Team is hidden for everyone.
 */
export const TEAM_ROLLOUT_OWNER_EMAILS: readonly string[] = [
  'jesuss387@gmail.com',
];

/** Open Team to all owners (ignores the email list). */
export const TEAM_ROLLOUT_OPEN_TO_ALL = false;

export function isTeamRolloutAllowlistActive(): boolean {
  return !TEAM_ROLLOUT_OPEN_TO_ALL && TEAM_ROLLOUT_OWNER_EMAILS.length > 0;
}

export function isOwnerEmailAllowedForTeamRollout(
  email: string | null | undefined
): boolean {
  if (TEAM_ROLLOUT_OPEN_TO_ALL) return true;
  if (TEAM_ROLLOUT_OWNER_EMAILS.length === 0) return false;

  const normalized = email?.trim().toLowerCase() ?? '';
  if (!normalized) return false;
  return TEAM_ROLLOUT_OWNER_EMAILS.some(
    entry => entry.toLowerCase() === normalized
  );
}
