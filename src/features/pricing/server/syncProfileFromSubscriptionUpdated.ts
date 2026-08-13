/**
 * Server-only: sync profile subscription state from Stripe subscription.updated.
 * Updates subscription_tier, subscription_status, subscription_current_period_end,
 * and subscription_cancel_at_period_end.
 * Used by the Stripe webhook when customer.subscription.updated (and invoice.payment_failed) runs sync.
 * Do not import from client code.
 */

import { STRIPE_SUBSCRIPTION_STATUSES_GRANTING_PRO } from '@/features/pricing/utils/isProAccess';
import type { BillingInterval } from '@/features/pricing/types';
import type { SupabaseClient } from '@supabase/supabase-js';

const PAYMENT_FAILED_STATUSES = new Set(['past_due', 'unpaid']);

export interface SyncProfileFromSubscriptionUpdatedParams {
  stripeSubscriptionId: string;
  subscriptionStatus: string;
  currentPeriodEndUnix: number | null;
  /** Stripe `cancel_at_period_end` — subscription stays active until period end but will not renew. */
  cancelAtPeriodEnd: boolean;
  /**
   * Clear `payment_failed_email_sent_at` when the status grants Pro (i.e. the
   * subscription recovered). Default `true`. Pass `false` from the
   * `invoice.payment_failed` path so a transient `active` status during a failed
   * charge can't wipe the once-per-episode guard and allow a duplicate email.
   */
  resetPaymentFailedFlagOnGrant?: boolean;
  /** Stripe price recurring interval (`month` or `year`). */
  subscriptionBillingInterval?: BillingInterval | null;
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
    resetPaymentFailedFlagOnGrant = true,
    subscriptionBillingInterval = null,
  } = params;

  const subId = stripeSubscriptionId?.trim();
  if (!subId) {
    return { success: false, error: 'stripeSubscriptionId is required' };
  }

  const normalizedStatus = subscriptionStatus?.trim() || '';
  const grantsPro =
    STRIPE_SUBSCRIPTION_STATUSES_GRANTING_PRO.has(normalizedStatus);
  const isPaymentFailed = PAYMENT_FAILED_STATUSES.has(normalizedStatus);
  const nowIso = new Date().toISOString();

  // Load prior snapshot so we only stamp cancel / fail timestamps on transitions.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error: loadError } = await (supabase as any)
    .from('profiles')
    .select(
      'user_id, subscription_status, subscription_cancel_at_period_end, subscription_canceled_at, last_payment_failed_at'
    )
    .eq('stripe_subscription_id', subId)
    .maybeSingle();

  if (loadError) {
    console.error(
      '[pricing] syncProfileFromSubscriptionUpdated load error:',
      loadError
    );
    return { success: false, error: loadError.message };
  }
  if (!existing) {
    console.error(
      '[pricing] syncProfileFromSubscriptionUpdated: no profile row matched stripe_subscription_id',
      subId
    );
    return {
      success: false,
      error: 'no profile found for this subscription id',
      noMatchingProfile: true,
    };
  }

  const prevStatus =
    typeof existing.subscription_status === 'string'
      ? existing.subscription_status.trim()
      : '';
  const prevCancel = Boolean(existing.subscription_cancel_at_period_end);
  const prevWasPaymentFailed = PAYMENT_FAILED_STATUSES.has(prevStatus);

  const updates: Record<string, unknown> = {
    subscription_status: normalizedStatus || null,
    subscription_tier: grantsPro ? 'pro' : 'free',
    subscription_cancel_at_period_end: Boolean(cancelAtPeriodEnd),
    updated_at: nowIso,
  };

  // Cancel episode: stamp when cancel first turns on; clear if undone.
  if (cancelAtPeriodEnd && !prevCancel) {
    updates.subscription_canceled_at = nowIso;
  } else if (!cancelAtPeriodEnd) {
    updates.subscription_canceled_at = null;
  }

  // Payment-failed episode: stamp when entering past_due/unpaid (not every retry).
  if (isPaymentFailed && !prevWasPaymentFailed) {
    updates.last_payment_failed_at = nowIso;
  }

  // Subscription recovered to an active/granting state — clear the payment-failed
  // notification flag so a future, separate failure can notify the owner again.
  // Skipped on the invoice.payment_failed path (resetPaymentFailedFlagOnGrant=false)
  // so a transient `active` status mid-failure can't wipe the guard.
  // Do NOT clear last_payment_failed_at — keep for analytics.
  if (grantsPro && resetPaymentFailedFlagOnGrant) {
    updates.payment_failed_email_sent_at = null;
  }

  if (currentPeriodEndUnix != null) {
    updates.subscription_current_period_end = new Date(
      currentPeriodEndUnix * 1000
    ).toISOString();
  }
  if (subscriptionBillingInterval) {
    updates.subscription_billing_interval = subscriptionBillingInterval;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('stripe_subscription_id', subId)
    .select('user_id');

  if (error) {
    console.error('[pricing] syncProfileFromSubscriptionUpdated error:', error);
    return { success: false, error: error.message };
  }

  if (!data?.length) {
    console.error(
      '[pricing] syncProfileFromSubscriptionUpdated: no profile row matched stripe_subscription_id',
      subId
    );
    return {
      success: false,
      error: 'no profile found for this subscription id',
      noMatchingProfile: true,
    };
  }

  return { success: true };
}
