import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PENDING_TEAM_INVITE_STATUS } from '../constants/teamInvite';
import { ACTIVE_TEAM_MEMBER_STATUS } from '../constants/teamRoles';
import type { TeamMemberUiSource } from '../types/teamMemberUi';
import { parseTeamInviteName } from '../utils/parseTeamInviteName';
import { adminDb } from './adminDb';

export type UpdateTeamMemberNameResult =
  | { ok: true; name: string }
  | { ok: false; error: string; status: number };

async function inviteIdForActiveMember(
  admin: SupabaseClient<Database>,
  params: { businessId: string; memberId: string }
): Promise<string | null> {
  const db = adminDb(admin);
  const { data: member } = await db
    .from('business_members')
    .select('user_id')
    .eq('id', params.memberId)
    .eq('business_id', params.businessId)
    .eq('status', ACTIVE_TEAM_MEMBER_STATUS)
    .maybeSingle();

  const userId =
    typeof member?.user_id === 'string' ? member.user_id.trim() : '';
  if (!userId) return null;

  const { data: byUser } = await db
    .from('team_invites')
    .select('id')
    .eq('business_id', params.businessId)
    .eq('accepted_user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (typeof byUser?.id === 'string' && byUser.id.trim()) {
    return byUser.id.trim();
  }

  const { data: userData } = await admin.auth.admin.getUserById(userId);
  const email = userData.user?.email?.trim().toLowerCase() ?? '';
  if (!email) return null;

  const { data: byEmail } = await db
    .from('team_invites')
    .select('id')
    .eq('business_id', params.businessId)
    .eq('email', email)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return typeof byEmail?.id === 'string' && byEmail.id.trim()
    ? byEmail.id.trim()
    : null;
}

/** Owner-typed name on `team_invites`. Used for Team + assignee labels. */
export async function updateTeamMemberName(
  admin: SupabaseClient<Database>,
  params: {
    businessId: string;
    id: string;
    source: TeamMemberUiSource;
    rawName: unknown;
  }
): Promise<UpdateTeamMemberNameResult> {
  const parsed = parseTeamInviteName(params.rawName);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, status: parsed.status };
  }

  const db = adminDb(admin);
  let inviteId = params.id.trim();

  if (params.source === 'invite') {
    const { data: invite } = await db
      .from('team_invites')
      .select('id')
      .eq('id', inviteId)
      .eq('business_id', params.businessId)
      .eq('status', PENDING_TEAM_INVITE_STATUS)
      .maybeSingle();
    if (!invite?.id) {
      return { ok: false, error: 'Invite not found', status: 404 };
    }
  } else {
    const found = await inviteIdForActiveMember(admin, {
      businessId: params.businessId,
      memberId: inviteId,
    });
    if (!found) {
      return { ok: false, error: 'Member not found', status: 404 };
    }
    inviteId = found;
  }

  const { error } = await db
    .from('team_invites')
    .update({ name: parsed.name })
    .eq('id', inviteId)
    .eq('business_id', params.businessId);

  if (error) {
    return { ok: false, error: 'Could not update name', status: 500 };
  }

  return { ok: true, name: parsed.name };
}
