import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ACTIVE_TEAM_MEMBER_STATUS,
  membershipRoleFromInvite,
} from '../constants/teamRoles';
import { normalizeTeamInviteEmail } from '../utils/normalizeTeamInviteEmail';
import { loadBusinessTeamAccess } from './loadBusinessTeamAccess';
import { loadTeamInviteByToken } from './loadTeamInviteByToken';
import { lookupOwnedBusinessId } from './lookupOwnedBusinessId';
import { lookupActiveMemberBusinessId } from './lookupActiveMemberBusinessId';
import { adminDb } from './adminDb';

export type AcceptTeamInviteResult =
  | { ok: true; businessId: string; businessName: string }
  | { ok: false; error: string; status: number };

export async function acceptTeamInvite(
  admin: SupabaseClient<Database>,
  params: {
    rawToken: string;
    userId: string;
    userEmail: string | null;
  }
): Promise<AcceptTeamInviteResult> {
  const loaded = await loadTeamInviteByToken(admin, params.rawToken);
  if (!loaded.ok) {
    const message =
      loaded.reason === 'expired'
        ? 'This invite has expired'
        : loaded.reason === 'used'
          ? 'This invite was already used'
          : 'This invite is invalid or expired';
    return { ok: false, error: message, status: 400 };
  }

  const inviteEmail = normalizeTeamInviteEmail(loaded.invite.email);
  const userEmail = normalizeTeamInviteEmail(params.userEmail ?? '');
  if (!userEmail || userEmail !== inviteEmail) {
    return {
      ok: false,
      error: `Sign in with ${loaded.invite.email} to accept this invite`,
      status: 403,
    };
  }

  const teamAccess = await loadBusinessTeamAccess(
    admin,
    loaded.invite.business_id
  );
  if (!teamAccess.hasAccess) {
    return {
      ok: false,
      error: 'This shop is not on the Team plan',
      status: 403,
    };
  }

  const ownedBusinessId = await lookupOwnedBusinessId(admin, params.userId);
  if (ownedBusinessId) {
    return {
      ok: false,
      error: 'This account already has a business',
      status: 409,
    };
  }

  const existingMembership = await lookupActiveMemberBusinessId(
    admin,
    params.userId
  );
  if (existingMembership && existingMembership !== loaded.invite.business_id) {
    return {
      ok: false,
      error: 'This account is already on another team',
      status: 409,
    };
  }

  const db = adminDb(admin);
  const { data: existingRow } = await db
    .from('business_members')
    .select('id, status')
    .eq('business_id', loaded.invite.business_id)
    .eq('user_id', params.userId)
    .maybeSingle();

  const role = membershipRoleFromInvite(loaded.invite.role);

  if (existingRow?.id) {
    const { error: reactivateError } = await db
      .from('business_members')
      .update({
        role,
        ...(existingRow.status !== ACTIVE_TEAM_MEMBER_STATUS
          ? { status: ACTIVE_TEAM_MEMBER_STATUS }
          : {}),
      })
      .eq('id', existingRow.id);
    if (reactivateError) {
      return { ok: false, error: 'Could not join the team', status: 500 };
    }
  } else {
    const { error: insertError } = await db.from('business_members').insert({
      business_id: loaded.invite.business_id,
      user_id: params.userId,
      role,
      status: ACTIVE_TEAM_MEMBER_STATUS,
    });
    if (insertError) {
      return { ok: false, error: 'Could not join the team', status: 500 };
    }
  }

  const { error: acceptError } = await db
    .from('team_invites')
    .update({
      status: 'accepted',
      accepted_user_id: params.userId,
    })
    .eq('id', loaded.invite.id);

  if (acceptError) {
    return { ok: false, error: 'Could not join the team', status: 500 };
  }

  return {
    ok: true,
    businessId: loaded.invite.business_id,
    businessName: loaded.businessName,
  };
}
