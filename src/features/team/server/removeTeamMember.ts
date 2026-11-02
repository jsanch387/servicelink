import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { TeamMemberUiSource } from '../types/teamMemberUi';
import { adminDb } from './adminDb';

export type RemoveTeamMemberResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

function todayUtcYmd(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

async function clearUpcomingAssignee(
  admin: SupabaseClient<Database>,
  params: { businessId: string; assignedUserId: string; asOf: string }
): Promise<void> {
  const { error } = await adminDb(admin)
    .from('bookings')
    .update({ assigned_user_id: null })
    .eq('business_id', params.businessId)
    .eq('assigned_user_id', params.assignedUserId)
    .eq('status', 'confirmed')
    .gte('scheduled_date', params.asOf);

  if (error) {
    console.error('[team] clear upcoming assignee failed', error);
  }
}

async function revokeShopSessions(
  admin: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  try {
    await admin.auth.admin.signOut(userId, 'global');
  } catch (error) {
    console.error('[team] revoke member sessions failed', error);
  }
}

export async function removeTeamMember(
  admin: SupabaseClient<Database>,
  params: {
    businessId: string;
    id: string;
    source: TeamMemberUiSource;
    asOf?: string;
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
    .select('id, user_id')
    .maybeSingle();

  if (error) {
    return { ok: false, error: 'Could not remove team member', status: 500 };
  }
  if (!data?.id) {
    return { ok: false, error: 'Team member not found', status: 404 };
  }

  const assignedUserId =
    typeof data.user_id === 'string' ? data.user_id.trim() : '';
  if (assignedUserId) {
    await revokeAcceptedInviteForMember(admin, {
      businessId: params.businessId,
      acceptedUserId: assignedUserId,
    });
    await clearUpcomingAssignee(admin, {
      businessId: params.businessId,
      assignedUserId,
      asOf: params.asOf?.trim() || todayUtcYmd(),
    });
    await revokeShopSessions(admin, assignedUserId);
  }

  return { ok: true };
}

async function revokeAcceptedInviteForMember(
  admin: SupabaseClient<Database>,
  params: { businessId: string; acceptedUserId: string }
): Promise<void> {
  const { error } = await adminDb(admin)
    .from('team_invites')
    .update({ status: 'revoked' })
    .eq('business_id', params.businessId)
    .eq('accepted_user_id', params.acceptedUserId)
    .eq('status', 'accepted');

  if (error) {
    console.error('[team] revoke accepted invite failed', error);
  }
}
