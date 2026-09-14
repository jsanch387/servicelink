import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminDb } from './adminDb';
import { PENDING_TEAM_INVITE_STATUS } from '../constants/teamInvite';
import { ACTIVE_TEAM_MEMBER_STATUS } from '../constants/teamRoles';
import type { TeamMemberUi } from '../types/teamMemberUi';

export async function listTeamMembersForOwner(
  admin: SupabaseClient<Database>,
  businessId: string
): Promise<TeamMemberUi[]> {
  const db = adminDb(admin);
  const [{ data: invites }, { data: members }] = await Promise.all([
    db
      .from('team_invites')
      .select('id, email, created_at')
      .eq('business_id', businessId)
      .eq('status', PENDING_TEAM_INVITE_STATUS)
      .order('created_at', { ascending: true }),
    db
      .from('business_members')
      .select('id, user_id, created_at')
      .eq('business_id', businessId)
      .eq('status', ACTIVE_TEAM_MEMBER_STATUS)
      .order('created_at', { ascending: true }),
  ]);

  const invited: TeamMemberUi[] = (
    (invites ?? []) as Array<{ id: string; email: string }>
  ).map(invite => ({
    id: invite.id,
    email: invite.email,
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
      status: 'active',
      source: 'member',
    });
  }

  return [...invited, ...active];
}
