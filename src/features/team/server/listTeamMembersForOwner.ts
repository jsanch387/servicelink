import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminDb } from './adminDb';
import { PENDING_TEAM_INVITE_STATUS } from '../constants/teamInvite';
import { ACTIVE_TEAM_MEMBER_STATUS } from '../constants/teamRoles';
import type { TeamMemberUi } from '../types/teamMemberUi';
import { teamInviteDisplayName } from '../utils/teamInviteDisplayName';

export async function listTeamMembersForOwner(
  admin: SupabaseClient<Database>,
  businessId: string
): Promise<TeamMemberUi[]> {
  const db = adminDb(admin);
  const [{ data: invites }, { data: members }] = await Promise.all([
    db
      .from('team_invites')
      .select('id, email, name, status, accepted_user_id, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true }),
    db
      .from('business_members')
      .select('id, user_id, created_at')
      .eq('business_id', businessId)
      .eq('status', ACTIVE_TEAM_MEMBER_STATUS)
      .order('created_at', { ascending: true }),
  ]);

  const inviteRows = (invites ?? []) as Array<{
    id: string;
    email: string;
    name: string | null;
    status: string;
    accepted_user_id: string | null;
  }>;

  const invited: TeamMemberUi[] = inviteRows
    .filter(invite => invite.status === PENDING_TEAM_INVITE_STATUS)
    .map(invite => ({
      id: invite.id,
      email: invite.email,
      name: invite.name?.trim() || null,
      status: 'invited',
      source: 'invite',
    }));

  const active: TeamMemberUi[] = [];
  for (const member of (members ?? []) as Array<{
    id: string;
    user_id: string;
  }>) {
    const { data } = await admin.auth.admin.getUserById(member.user_id);
    const email = data.user?.email?.trim().toLowerCase();
    if (!email) continue;
    active.push({
      id: member.id,
      email,
      name: teamInviteDisplayName(inviteRows, {
        userId: member.user_id,
        email,
      }),
      status: 'active',
      source: 'member',
    });
  }

  return [...invited, ...active];
}
