/** People in `business_members` only. The account owner is not a row. */
export const TEAM_MEMBER_ROLES = ['member'] as const;
export type TeamMemberRole = (typeof TEAM_MEMBER_ROLES)[number];

export const TEAM_MEMBER_STATUSES = ['active', 'removed'] as const;
export type TeamMemberStatus = (typeof TEAM_MEMBER_STATUSES)[number];

/** Only this status grants access to the business. */
export const ACTIVE_TEAM_MEMBER_STATUS = 'active' satisfies TeamMemberStatus;

export function isTeamMemberRole(value: string): value is TeamMemberRole {
  return (TEAM_MEMBER_ROLES as readonly string[]).includes(value);
}

export function isActiveTeamMemberStatus(
  value: string | null | undefined
): boolean {
  return value === ACTIVE_TEAM_MEMBER_STATUS;
}
