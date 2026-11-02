import { TEAM_SEAT_LIMIT } from '@/features/pricing/types';
import { teamInviteWouldExceedSeatLimit } from '@/features/pricing/utils/teamSeatCapacity';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PENDING_TEAM_INVITE_STATUS } from '../constants/teamInvite';
import { ACTIVE_TEAM_MEMBER_STATUS } from '../constants/teamRoles';
import { normalizeTeamInviteEmail } from '../utils/normalizeTeamInviteEmail';
import { loadBusinessTeamAccess } from './loadBusinessTeamAccess';

export type AssertCanCreateTeamInviteResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

const TEAM_UPGRADE_ERROR = 'Upgrade to Team to add people to this shop.';

/**
 * New invites need Team access and an open seat. Resending a pending invite
 * does not take another seat. Grandfathered shops over the cap keep the
 * people they already have and cannot add more.
 */
export async function assertCanCreateTeamInvite(
  supabase: SupabaseClient<Database>,
  params: { businessId: string; rawEmail: string }
): Promise<AssertCanCreateTeamInviteResult> {
  const access = await loadBusinessTeamAccess(supabase, params.businessId);
  if (!access.hasAccess) {
    return { ok: false, error: TEAM_UPGRADE_ERROR, status: 403 };
  }

  const email = normalizeTeamInviteEmail(params.rawEmail);
  let resendingPendingInvite = false;
  if (email) {
    const { data: pendingSame } = await supabase
      .from('team_invites')
      .select('id')
      .eq('business_id', params.businessId)
      .eq('email', email)
      .eq('status', PENDING_TEAM_INVITE_STATUS)
      .maybeSingle();
    resendingPendingInvite = Boolean(
      (pendingSame as { id?: string } | null)?.id
    );
  }

  const [{ count: activeMemberCount }, { count: pendingInviteCount }] =
    await Promise.all([
      supabase
        .from('business_members')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', params.businessId)
        .eq('status', ACTIVE_TEAM_MEMBER_STATUS),
      supabase
        .from('team_invites')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', params.businessId)
        .eq('status', PENDING_TEAM_INVITE_STATUS),
    ]);

  const full = teamInviteWouldExceedSeatLimit({
    activeMemberCount: activeMemberCount ?? 0,
    pendingInviteCount: pendingInviteCount ?? 0,
    seatLimit: TEAM_SEAT_LIMIT,
    resendingPendingInvite,
  });

  if (full) {
    return {
      ok: false,
      error: `Team includes up to ${TEAM_SEAT_LIMIT} people, including you.`,
      status: 409,
    };
  }

  return { ok: true };
}
