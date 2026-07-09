/**
 * Server-only: update profiles row after successful Stripe checkout.
 * Used by the Stripe webhook when checkout.session.completed fires.
 * Do not import from client code.
 */

import type { BillingInterval } from '@/features/pricing/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface UpdateProfileFromCheckoutParams {
  /** Supabase auth user id (profiles.user_id). From session.metadata.userId. */
  userId: string;
  /** Stripe Customer ID. From session.customer. */
  stripeCustomerId: string | null;
  /** Stripe Subscription ID. From session.subscription. */
  stripeSubscriptionId: string | null;
  /** End of current billing period (ISO string). From subscription.current_period_end. */
  currentPeriodEnd: string | null;
  /** Stripe subscription status from retrieved subscription (e.g. active, trialing). */
  subscriptionStatus?: string | null;
  /** Recurring cadence from Stripe price (`month` or `year`). */
  subscriptionBillingInterval?: BillingInterval | null;
}

/**
 * Sets the user's profile to Pro and stores Stripe IDs and period end.
 * Idempotent: safe to call multiple times for the same user.
 */
export async function updateProfileFromCheckout(
  supabase: SupabaseClient,
  params: UpdateProfileFromCheckoutParams
): Promise<{ success: boolean; error?: string }> {
  const {
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    currentPeriodEnd,
    subscriptionStatus,
    subscriptionBillingInterval,
  } = params;

  if (!userId?.trim()) {
    return { success: false, error: 'userId is required' };
  }

  const updates: Record<string, unknown> = {
    subscription_tier: 'pro',
    subscription_status: subscriptionStatus?.trim() || 'active',
    subscription_cancel_at_period_end: false,
    // Fresh paid/active subscription — reset any prior payment-failed notification.
    payment_failed_email_sent_at: null,
    updated_at: new Date().toISOString(),
  };

  if (stripeCustomerId) {
    updates.stripe_customer_id = stripeCustomerId;
  }
  if (stripeSubscriptionId) {
    updates.stripe_subscription_id = stripeSubscriptionId;
  }
  if (currentPeriodEnd) {
    updates.subscription_current_period_end = currentPeriodEnd;
  }
  if (subscriptionBillingInterval) {
    updates.subscription_billing_interval = subscriptionBillingInterval;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('user_id', userId);

  if (error) {
    console.error('[pricing] updateProfileFromCheckout error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
