/**
 * Whether this business may send customer SMS right now.
 *
 * Gates (all required):
 * 1. Business exists and has an owner profile
 * 2. Temporary rollout allowlist (owner email) — only when the list is non-empty
 *
 * Free and Pro owners both send. Free volume stays small because new public
 * bookings stop at the lifetime cap (`FREE_BOOKINGS_LIMIT`); there is no
 * separate SMS plan gate.
 *
 * Master switch {@link isSmsOutboundEnabled} is checked separately in
 * `sendAndRecordSms`.
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  isOwnerEmailAllowedForSmsRollout,
  isSmsRolloutAllowlistActive,
} from '../config/smsRolloutAllowlist';

export type BusinessSmsEligibility =
  | { ok: true }
  | { ok: false; reason: 'no_owner' | 'not_in_rollout' | 'error' };

export async function canBusinessSendCustomerSms(
  admin: SupabaseClient<Database>,
  businessId: string
): Promise<BusinessSmsEligibility> {
  const id = businessId?.trim();
  if (!id) {
    return { ok: false, reason: 'no_owner' };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: biz, error: bizError } = await (admin as any)
      .from('business_profiles')
      .select('profile_id')
      .eq('id', id)
      .maybeSingle();

    if (bizError) {
      return { ok: false, reason: 'error' };
    }

    const profileId = String(
      (biz as { profile_id?: string | null } | null)?.profile_id ?? ''
    ).trim();
    if (!profileId) {
      return { ok: false, reason: 'no_owner' };
    }

    if (!isSmsRolloutAllowlistActive()) {
      return { ok: true };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authResult = await (admin as any).auth.admin.getUserById(profileId);
    const email =
      (authResult?.data?.user?.email as string | undefined) ??
      (authResult?.user?.email as string | undefined) ??
      null;

    if (!isOwnerEmailAllowedForSmsRollout(email)) {
      return { ok: false, reason: 'not_in_rollout' };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
