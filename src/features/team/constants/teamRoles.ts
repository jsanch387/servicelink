/** People in `business_members` only. The account owner is not a row. */
export const TEAM_MEMBER_ROLES = ['member', 'coordinator'] as const;
export type TeamMemberRole = (typeof TEAM_MEMBER_ROLES)[number];

/** Roles the owner can pick on an invite. Manager can be stored before its access is finished. */
export const ASSIGNABLE_TEAM_ROLES = [
  'member',
  'coordinator',
  'manager',
] as const;
export type AssignableTeamRole = (typeof ASSIGNABLE_TEAM_ROLES)[number];

export const TEAM_ROLE_COPY = {
  member: {
    label: 'Member',
    description: 'Completes jobs. They can see every booking and run it.',
  },
  coordinator: {
    label: 'Coordinator',
    description:
      'Schedules jobs. They can add, reschedule, cancel, and delete appointments.',
  },
  manager: {
    label: 'Manager',
    description:
      'Runs the shop day to day, except billing, payouts, the team, and deleting the account.',
  },
} as const;

export type StoredTeamRole = keyof typeof TEAM_ROLE_COPY;

export function storedTeamRole(
  value: string | null | undefined
): StoredTeamRole {
  if (value === 'coordinator' || value === 'manager') return value;
  return 'member';
}

export function teamRoleCopy(value: string | null | undefined): {
  label: string;
  description: string;
} {
  return TEAM_ROLE_COPY[storedTeamRole(value)];
}

/** Role written onto `business_members` when an invite is accepted. */
export function membershipRoleFromInvite(
  value: string | null | undefined
): StoredTeamRole {
  return storedTeamRole(value);
}

export const TEAM_MEMBER_STATUSES = ['active', 'removed'] as const;
export type TeamMemberStatus = (typeof TEAM_MEMBER_STATUSES)[number];

/** Only this status grants access to the business. */
export const ACTIVE_TEAM_MEMBER_STATUS = 'active' satisfies TeamMemberStatus;
export const REMOVED_TEAM_MEMBER_STATUS = 'removed' satisfies TeamMemberStatus;

export function isTeamMemberRole(value: string): value is TeamMemberRole {
  return (TEAM_MEMBER_ROLES as readonly string[]).includes(value);
}

export function isActiveTeamMemberStatus(
  value: string | null | undefined
): boolean {
  return value === ACTIVE_TEAM_MEMBER_STATUS;
}
