import { getEmailTypoHint, isValidEmail } from '@/features/auth';
import type { TeamMemberUi } from '../types/teamMemberUi';
import { normalizeTeamInviteEmail } from './normalizeTeamInviteEmail';

export type ApplyTeamInviteResult =
  | { ok: true; member: TeamMemberUi }
  | { ok: false; error: string };

export function applyTeamInvite(
  members: readonly TeamMemberUi[],
  rawEmail: string
): ApplyTeamInviteResult {
  const email = normalizeTeamInviteEmail(rawEmail);
  if (!email) {
    return { ok: false, error: 'Email is required' };
  }

  const typo = getEmailTypoHint(email);
  if (typo || !isValidEmail(email)) {
    return { ok: false, error: typo ?? 'Enter a valid email' };
  }

  if (members.some(member => member.email === email)) {
    return { ok: false, error: 'Already on the team' };
  }

  return {
    ok: true,
    member: {
      id: crypto.randomUUID(),
      email,
      status: 'invited',
      source: 'invite',
    },
  };
}

export function applyTeamRemove(
  members: readonly TeamMemberUi[],
  id: string
): TeamMemberUi[] {
  return members.filter(member => member.id !== id);
}
