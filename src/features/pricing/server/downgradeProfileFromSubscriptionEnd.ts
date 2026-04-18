/**
 * Server-only: set profile back to free when Stripe subscription ends (cancel/delete).
 * Used by the Stripe webhook when customer.subscription.deleted fires.
 * Do not import from client code.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Finds the profile by stripe_subscription_id and sets subscription_tier to 'free',
 * clears stripe_subscription_id and subscription_current_period_end.
 * Keeps stripe_customer_id so the user can resubscribe.
 */
export async function downgradeProfileFromSubscriptionEnd(
  supabase: SupabaseClient,
  stripeSubscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  if (!stripeSubscriptionId?.trim()) {
    return { success: false, error: 'stripeSubscriptionId is required' };
  }

  const updates: Record<string, unknown> = {
    subscription_tier: 'free',
    subscription_status: null,
    stripe_subscription_id: null,
    subscription_current_period_end: null,
    subscription_cancel_at_period_end: false,
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('stripe_subscription_id', stripeSubscriptionId.trim())
    .select('user_id');

  if (error) {
    console.error(
      '[pricing] downgradeProfileFromSubscriptionEnd error:',
      error
    );
    return { success: false, error: error.message };
  }

  // No row found = subscription id not in our DB (e.g. test mode vs live)
  if (!data?.length) {
    console.warn(
      '[pricing] downgradeProfileFromSubscriptionEnd: no profile found for subscription',
      stripeSubscriptionId
    );
    return { success: true }; // idempotent: treat as success so Stripe doesn't retry
  }

  return { success: true };
}
