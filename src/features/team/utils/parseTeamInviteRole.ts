import {
  ASSIGNABLE_TEAM_ROLES,
  type AssignableTeamRole,
} from '../constants/teamRoles';

export type ParseTeamInviteRoleResult =
  | { ok: true; role: AssignableTeamRole }
  | { ok: false; error: string; status: number };

/** Missing role stays Member so older mobile invites keep working. */
export function parseTeamInviteRole(
  value: unknown
): ParseTeamInviteRoleResult {
  if (value == null || value === '') {
    return { ok: true, role: 'member' };
  }

  if (
    typeof value === 'string' &&
    (ASSIGNABLE_TEAM_ROLES as readonly string[]).includes(value)
  ) {
    return { ok: true, role: value as AssignableTeamRole };
  }

  return {
    ok: false,
    error: 'Choose Member, Coordinator, or Manager.',
    status: 400,
  };
}
