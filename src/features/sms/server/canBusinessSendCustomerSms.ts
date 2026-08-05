/**
 * Whether this business may send customer SMS right now.
 *
 * Gates (all required):
 * 1. Owner has Pro access ({@link isProAccess})
 * 2. Temporary rollout allowlist (owner email) — only when the list is non-empty
 *
 * Master switch {@link isSmsOutboundEnabled} is checked separately in
 * `sendAndRecordSms`.
 */

import { isProAccess } from '@/features/pricing/utils/isProAccess';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  isOwnerEmailAllowedForSmsRollout,
  isSmsRolloutAllowlistActive,
} from '../config/smsRolloutAllowlist';

export type BusinessSmsEligibility =
  | { ok: true }
  | { ok: false; reason: 'not_pro' | 'not_in_rollout' | 'error' };

export async function canBusinessSendCustomerSms(
  admin: SupabaseClient<Database>,
  businessId: string
): Promise<BusinessSmsEligibility> {
  const id = businessId?.trim();
  if (!id) {
    return { ok: false, reason: 'not_pro' };
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
      return { ok: false, reason: 'not_pro' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileRow, error: profileError } = await (admin as any)
      .from('profiles')
      .select(
        'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
      )
      .eq('user_id', profileId)
      .maybeSingle();

    if (profileError) {
      return { ok: false, reason: 'error' };
    }

    const row = profileRow as {
      subscription_tier?: string | null;
      subscription_current_period_end?: string | null;
      subscription_status?: string | null;
      stripe_subscription_id?: string | null;
      stripe_customer_id?: string | null;
    } | null;

    const isPro = isProAccess(
      row?.subscription_tier,
      row?.subscription_current_period_end,
      row?.subscription_status,
      row?.stripe_subscription_id,
      row?.stripe_customer_id
    );
    if (!isPro) {
      return { ok: false, reason: 'not_pro' };
    }

    if (isSmsRolloutAllowlistActive()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const authResult = await (admin as any).auth.admin.getUserById(profileId);
      const email =
        (authResult?.data?.user?.email as string | undefined) ??
        (authResult?.user?.email as string | undefined) ??
        null;

      if (!isOwnerEmailAllowedForSmsRollout(email)) {
        return { ok: false, reason: 'not_in_rollout' };
      }
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
