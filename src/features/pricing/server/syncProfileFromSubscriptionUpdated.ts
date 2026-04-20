/**
 * Server-only: sync profile subscription state from Stripe subscription.updated.
 * Updates subscription_tier, subscription_status, subscription_current_period_end,
 * and subscription_cancel_at_period_end.
 * Used by the Stripe webhook when customer.subscription.updated (and invoice.payment_failed) runs sync.
 * Do not import from client code.
 */

import { STRIPE_SUBSCRIPTION_STATUSES_GRANTING_PRO } from '@/features/pricing/utils/isProAccess';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface SyncProfileFromSubscriptionUpdatedParams {
  stripeSubscriptionId: string;
  subscriptionStatus: string;
  currentPeriodEndUnix: number | null;
  /** Stripe `cancel_at_period_end` — subscription stays active until period end but will not renew. */
  cancelAtPeriodEnd: boolean;
}

/**
 * Finds the profile by stripe_subscription_id and updates subscription_tier,
 * subscription_status, and subscription_current_period_end (e.g. on renewal or past_due).
 */
export async function syncProfileFromSubscriptionUpdated(
  supabase: SupabaseClient,
  params: SyncProfileFromSubscriptionUpdatedParams
): Promise<{
  success: boolean;
  error?: string;
  /** True when no `profiles` row had this `stripe_subscription_id` (event acknowledged but nothing to update). */
  noMatchingProfile?: boolean;
}> {
  const {
    stripeSubscriptionId,
    subscriptionStatus,
    currentPeriodEndUnix,
    cancelAtPeriodEnd,
  } = params;

  if (!stripeSubscriptionId?.trim()) {
    return { success: false, error: 'stripeSubscriptionId is required' };
  }

  const normalizedStatus = subscriptionStatus?.trim() || '';
  const updates: Record<string, unknown> = {
    subscription_status: normalizedStatus || null,
    subscription_tier: STRIPE_SUBSCRIPTION_STATUSES_GRANTING_PRO.has(
      normalizedStatus
    )
      ? 'pro'
      : 'free',
    subscription_cancel_at_period_end: Boolean(cancelAtPeriodEnd),
    updated_at: new Date().toISOString(),
  };

  if (currentPeriodEndUnix != null) {
    updates.subscription_current_period_end = new Date(
      currentPeriodEndUnix * 1000
    ).toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('stripe_subscription_id', stripeSubscriptionId.trim())
    .select('user_id');

  if (error) {
    console.error('[pricing] syncProfileFromSubscriptionUpdated error:', error);
    return { success: false, error: error.message };
  }

  if (!data?.length) {
    console.error(
      '[pricing] syncProfileFromSubscriptionUpdated: no profile row matched stripe_subscription_id',
      stripeSubscriptionId.trim()
    );
    return {
      success: false,
      error: 'no profile found for this subscription id',
      noMatchingProfile: true,
    };
  }

  return { success: true };
}
