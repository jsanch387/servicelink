import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PENDING_TEAM_INVITE_STATUS } from '../constants/teamInvite';
import type { TeamInviteRow } from '../types/teamInvite';
import { hashTeamInviteToken } from '../utils/hashTeamInviteToken';
import { adminDb } from './adminDb';

export type LoadTeamInviteByTokenResult =
  | {
      ok: true;
      invite: TeamInviteRow;
      businessName: string;
    }
  | { ok: false; reason: 'invalid' | 'expired' | 'used' };

export async function loadTeamInviteByToken(
  admin: SupabaseClient<Database>,
  rawToken: string
): Promise<LoadTeamInviteByTokenResult> {
  const token = rawToken.trim();
  if (!token) return { ok: false, reason: 'invalid' };

  const db = adminDb(admin);
  const { data: invite, error } = await db
    .from('team_invites')
    .select(
      'id, business_id, email, link_token_hash, status, invited_by, accepted_user_id, expires_at, created_at, updated_at'
    )
    .eq('link_token_hash', hashTeamInviteToken(token))
    .maybeSingle();

  if (error || !invite) {
    return { ok: false, reason: 'invalid' };
  }

  if (invite.status === 'accepted') {
    return { ok: false, reason: 'used' };
  }

  if (invite.status !== PENDING_TEAM_INVITE_STATUS) {
    return { ok: false, reason: 'invalid' };
  }

  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    await db
      .from('team_invites')
      .update({ status: 'expired' })
      .eq('id', invite.id);
    return { ok: false, reason: 'expired' };
  }

  const { data: shop } = await db
    .from('business_profiles')
    .select('business_name')
    .eq('id', invite.business_id)
    .maybeSingle();

  return {
    ok: true,
    invite: invite as TeamInviteRow,
    businessName: shop?.business_name?.trim() || 'this shop',
  };
}
