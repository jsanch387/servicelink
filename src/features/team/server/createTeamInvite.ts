import { getEmailTypoHint, isValidEmail } from '@/features/auth';
import { sendTeamInviteEmail } from '@/features/email/team-invite/sendTeamInviteEmail';
import { getAppBaseUrl } from '@/features/email/services/resendClient';
import { getTeamInvitePath } from '@/constants/routes';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminDb } from './adminDb';
import {
  PENDING_TEAM_INVITE_STATUS,
  TEAM_INVITE_EXPIRY_DAYS,
} from '../constants/teamInvite';
import { ACTIVE_TEAM_MEMBER_STATUS } from '../constants/teamRoles';
import { normalizeTeamInviteEmail } from '../utils/normalizeTeamInviteEmail';
import { createTeamInviteToken } from '../utils/hashTeamInviteToken';
import type { TeamMemberUi } from '../types/teamMemberUi';

export type TeamInviteCreated = {
  id: string;
  email: string;
  name: string | null;
  status: 'pending';
};

export type CreateTeamInviteResult =
  | {
      ok: true;
      member: TeamMemberUi;
      invite: TeamInviteCreated;
      resent: boolean;
    }
  | { ok: false; error: string; status: number };

function expiresAtFromNow(): string {
  const expires = new Date();
  expires.setDate(expires.getDate() + TEAM_INVITE_EXPIRY_DAYS);
  return expires.toISOString();
}

async function activeMemberHasEmail(
  admin: SupabaseClient<Database>,
  businessId: string,
  email: string
): Promise<boolean> {
  const { data: members, error } = await adminDb(admin)
    .from('business_members')
    .select('user_id')
    .eq('business_id', businessId)
    .eq('status', ACTIVE_TEAM_MEMBER_STATUS);

  if (error || !members?.length) return false;

  for (const member of members) {
    const { data } = await admin.auth.admin.getUserById(member.user_id);
    const memberEmail = data.user?.email?.trim().toLowerCase();
    if (memberEmail === email) return true;
  }

  return false;
}

export async function createTeamInvite(
  admin: SupabaseClient<Database>,
  params: {
    businessId: string;
    invitedBy: string;
    ownerEmail: string | null;
    businessName: string;
    rawEmail: string;
    name: string;
    inviteBaseUrl?: string;
  }
): Promise<CreateTeamInviteResult> {
  const email = normalizeTeamInviteEmail(params.rawEmail);
  if (!email) {
    return { ok: false, error: 'Email is required', status: 400 };
  }

  const typo = getEmailTypoHint(email);
  if (typo || !isValidEmail(email)) {
    return { ok: false, error: typo ?? 'Enter a valid email', status: 400 };
  }

  const ownerEmail = params.ownerEmail?.trim().toLowerCase() ?? '';
  if (ownerEmail && ownerEmail === email) {
    return {
      ok: false,
      error: 'You are already the owner of this shop',
      status: 400,
    };
  }

  if (await activeMemberHasEmail(admin, params.businessId, email)) {
    return { ok: false, error: 'Already on the team', status: 409 };
  }

  const { rawToken, tokenHash } = createTeamInviteToken();
  const expiresAt = expiresAtFromNow();
  const db = adminDb(admin);

  const { data: existingPending } = await db
    .from('team_invites')
    .select('id, email, name, status')
    .eq('business_id', params.businessId)
    .eq('email', email)
    .eq('status', PENDING_TEAM_INVITE_STATUS)
    .maybeSingle();

  const { data: existingPrior } = existingPending?.id
    ? { data: null }
    : await db
        .from('team_invites')
        .select('id, email, name, status')
        .eq('business_id', params.businessId)
        .eq('email', email)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

  const reuseId = existingPending?.id ?? existingPrior?.id ?? '';
  let inviteId = reuseId;
  const resent = Boolean(reuseId);
  const nextName = params.name.trim();
  if (!nextName) {
    return { ok: false, error: 'Enter their name.', status: 400 };
  }

  if (reuseId) {
    const { error: updateError } = await db
      .from('team_invites')
      .update({
        link_token_hash: tokenHash,
        status: PENDING_TEAM_INVITE_STATUS,
        expires_at: expiresAt,
        accepted_user_id: null,
        invited_by: params.invitedBy,
        name: nextName,
      })
      .eq('id', reuseId);

    if (updateError) {
      return { ok: false, error: 'Could not update invite', status: 500 };
    }
  } else {
    const { data: inserted, error: insertError } = await db
      .from('team_invites')
      .insert({
        business_id: params.businessId,
        email,
        name: nextName,
        link_token_hash: tokenHash,
        status: PENDING_TEAM_INVITE_STATUS,
        invited_by: params.invitedBy,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (insertError || !inserted?.id) {
      return { ok: false, error: 'Could not create invite', status: 500 };
    }
    inviteId = inserted.id;
  }

  const inviteUrl = `${params.inviteBaseUrl || getAppBaseUrl()}${getTeamInvitePath(rawToken)}`;
  const emailed = await sendTeamInviteEmail(email, {
    businessName: params.businessName,
    recipientName: nextName,
    inviteUrl,
    expiresInDays: TEAM_INVITE_EXPIRY_DAYS,
  });

  if (!emailed.sent) {
    return {
      ok: false,
      error: emailed.error || 'Could not send invite email',
      status: 500,
    };
  }

  return {
    ok: true,
    resent,
    invite: {
      id: inviteId,
      email,
      name: nextName,
      status: PENDING_TEAM_INVITE_STATUS,
    },
    member: {
      id: inviteId,
      email,
      name: nextName,
      status: 'invited',
      source: 'invite',
    },
  };
}
