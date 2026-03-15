/**
 * Server-only: sync profile subscription state from Stripe subscription.updated.
 * Updates subscription_status and subscription_current_period_end.
 * Used by the Stripe webhook when customer.subscription.updated fires.
 * Do not import from client code.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface SyncProfileFromSubscriptionUpdatedParams {
  stripeSubscriptionId: string;
  subscriptionStatus: string;
  currentPeriodEndUnix: number | null;
}

/**
 * Finds the profile by stripe_subscription_id and updates subscription_status
 * and subscription_current_period_end (e.g. on renewal or status change to past_due).
 */
export async function syncProfileFromSubscriptionUpdated(
  supabase: SupabaseClient,
  params: SyncProfileFromSubscriptionUpdatedParams
): Promise<{ success: boolean; error?: string }> {
  const { stripeSubscriptionId, subscriptionStatus, currentPeriodEndUnix } =
    params;

  if (!stripeSubscriptionId?.trim()) {
    return { success: false, error: 'stripeSubscriptionId is required' };
  }

  const updates: Record<string, unknown> = {
    subscription_status: subscriptionStatus || null,
    updated_at: new Date().toISOString(),
  };

  if (currentPeriodEndUnix != null) {
    updates.subscription_current_period_end = new Date(
      currentPeriodEndUnix * 1000
    ).toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('stripe_subscription_id', stripeSubscriptionId.trim());

  if (error) {
    console.error('[pricing] syncProfileFromSubscriptionUpdated error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
