import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PENDING_TEAM_INVITE_STATUS } from '../constants/teamInvite';
import {
  ACTIVE_TEAM_MEMBER_STATUS,
  type AssignableTeamRole,
} from '../constants/teamRoles';
import type { TeamMemberUiSource } from '../types/teamMemberUi';
import { requireTeamRole } from '../utils/parseTeamInviteRole';
import { adminDb } from './adminDb';
import { inviteIdForActiveMember } from './updateTeamMemberName';

export type UpdateTeamMemberRoleResult =
  | { ok: true; role: AssignableTeamRole }
  | { ok: false; error: string; status: number };

/**
 * Owner changes the role on a pending invite or an active member.
 * Active members also update the accepted invite so a later rejoin
 * keeps the role the owner just picked.
 */
export async function updateTeamMemberRole(
  admin: SupabaseClient<Database>,
  params: {
    businessId: string;
    id: string;
    source: TeamMemberUiSource;
    rawRole: unknown;
  }
): Promise<UpdateTeamMemberRoleResult> {
  const parsed = requireTeamRole(params.rawRole);
  if (!parsed.ok) return parsed;

  const db = adminDb(admin);
  const role = parsed.role;

  if (params.source === 'invite') {
    const { data: invite } = await db
      .from('team_invites')
      .select('id')
      .eq('id', params.id.trim())
      .eq('business_id', params.businessId)
      .eq('status', PENDING_TEAM_INVITE_STATUS)
      .maybeSingle();
    if (!invite?.id) {
      return { ok: false, error: 'Invite not found', status: 404 };
    }

    const { error } = await db
      .from('team_invites')
      .update({ role })
      .eq('id', invite.id)
      .eq('business_id', params.businessId);
    if (error) {
      return { ok: false, error: 'Could not update role', status: 500 };
    }
    return { ok: true, role };
  }

  const memberId = params.id.trim();
  const { data: member } = await db
    .from('business_members')
    .select('id')
    .eq('id', memberId)
    .eq('business_id', params.businessId)
    .eq('status', ACTIVE_TEAM_MEMBER_STATUS)
    .maybeSingle();
  if (!member?.id) {
    return { ok: false, error: 'Member not found', status: 404 };
  }

  const { error } = await db
    .from('business_members')
    .update({ role })
    .eq('id', memberId)
    .eq('business_id', params.businessId);
  if (error) {
    return { ok: false, error: 'Could not update role', status: 500 };
  }

  const inviteId = await inviteIdForActiveMember(admin, {
    businessId: params.businessId,
    memberId,
  });
  if (inviteId) {
    const { error: inviteError } = await db
      .from('team_invites')
      .update({ role })
      .eq('id', inviteId)
      .eq('business_id', params.businessId);
    if (inviteError) {
      return { ok: false, error: 'Could not update role', status: 500 };
    }
  }

  return { ok: true, role };
}
