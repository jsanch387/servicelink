/**
 * Write-once first paid Pro conversion on `signup_attribution`.
 * Best-effort — never blocks checkout or subscription sync.
 *
 * "First paid" matches the welcome-email rule: Pro + `active` + a Stripe
 * subscription id (trials stay unstamped until they convert).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type MarkSignupAttributionFirstPaidParams = {
  userId?: string;
  stripeSubscriptionId?: string;
};

export type MarkSignupAttributionFirstPaidResult = {
  stamped: boolean;
  skippedReason?: string;
  error?: string;
};

type ProfilePaidRow = {
  user_id: string;
  subscription_tier: string | null;
  subscription_status: string | null;
  stripe_subscription_id: string | null;
};

function isPaidActivePro(row: ProfilePaidRow): boolean {
  const tier = (row.subscription_tier ?? '').trim().toLowerCase();
  const status = (row.subscription_status ?? '').trim().toLowerCase();
  const hasSubscription = Boolean(row.stripe_subscription_id?.trim());
  return tier === 'pro' && status === 'active' && hasSubscription;
}

export async function markSignupAttributionFirstPaid(
  supabase: SupabaseClient,
  params: MarkSignupAttributionFirstPaidParams
): Promise<MarkSignupAttributionFirstPaidResult> {
  const userIdInput = params.userId?.trim();
  const subIdInput = params.stripeSubscriptionId?.trim();
  if (!userIdInput && !subIdInput) {
    return {
      stamped: false,
      error: 'userId or stripeSubscriptionId is required',
    };
  }

  const profilesQuery = supabase
    .from('profiles')
    .select(
      'user_id, subscription_tier, subscription_status, stripe_subscription_id'
    );
  const { data: row, error: loadError } = await (
    userIdInput
      ? profilesQuery.eq('user_id', userIdInput)
      : profilesQuery.eq('stripe_subscription_id', subIdInput)
  ).maybeSingle();

  if (loadError) {
    return { stamped: false, error: loadError.message };
  }
  if (!row) {
    return { stamped: false, skippedReason: 'no_profile' };
  }

  const profile = row as ProfilePaidRow;
  const userId = profile.user_id?.trim() || userIdInput || '';
  if (!userId) {
    return { stamped: false, skippedReason: 'no_user_id' };
  }

  if (!isPaidActivePro(profile)) {
    return { stamped: false, skippedReason: 'not_paid_active_pro' };
  }

  const stampedAt = new Date().toISOString();
  const { data: claimed, error: stampError } = await supabase
    .from('signup_attribution')
    .update({ first_paid_at: stampedAt })
    .eq('user_id', userId)
    .is('first_paid_at', null)
    .select('user_id');

  if (stampError) {
    return { stamped: false, error: stampError.message };
  }
  if (!claimed?.length) {
    return { stamped: false, skippedReason: 'already_stamped_or_no_row' };
  }

  return { stamped: true };
}
