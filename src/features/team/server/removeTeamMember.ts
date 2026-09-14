import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { TeamMemberUiSource } from '../types/teamMemberUi';
import { adminDb } from './adminDb';

export type RemoveTeamMemberResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function removeTeamMember(
  admin: SupabaseClient<Database>,
  params: {
    businessId: string;
    id: string;
    source: TeamMemberUiSource;
  }
): Promise<RemoveTeamMemberResult> {
  if (params.source === 'invite') {
    const { data, error } = await adminDb(admin)
      .from('team_invites')
      .update({ status: 'revoked' })
      .eq('id', params.id)
      .eq('business_id', params.businessId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (error) {
      return { ok: false, error: 'Could not remove invite', status: 500 };
    }
    if (!data?.id) {
      return { ok: false, error: 'Invite not found', status: 404 };
    }
    return { ok: true };
  }

  const { data, error } = await adminDb(admin)
    .from('business_members')
    .update({ status: 'removed' })
    .eq('id', params.id)
    .eq('business_id', params.businessId)
    .eq('status', 'active')
    .select('id')
    .maybeSingle();

  if (error) {
    return { ok: false, error: 'Could not remove team member', status: 500 };
  }
  if (!data?.id) {
    return { ok: false, error: 'Team member not found', status: 404 };
  }
  return { ok: true };
}
