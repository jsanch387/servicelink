/**
 * Server-only: Check if a Stripe customer has any active or trialing subscriptions.
 * Used to prevent duplicate subscription creation.
 * Do not import from client code.
 */

import type Stripe from 'stripe';

export interface ActiveSubscriptionCheckResult {
  /** True if customer has at least one active or trialing subscription */
  hasActive: boolean;
  /** List of all active and trialing subscriptions for this customer */
  activeSubscriptions: Stripe.Subscription[];
  /** Summary for logging */
  summary: {
    activeCount: number;
    trialingCount: number;
    subscriptionIds: string[];
  };
}

/**
 * Queries Stripe for all active and trialing subscriptions on a customer.
 * Returns immediately if any are found, preventing duplicate subscription creation.
 *
 * @param stripe - Stripe instance
 * @param customerId - Stripe customer ID (cus_...)
 * @returns Active subscription check result with subscription list
 */
export async function checkActiveSubscriptions(
  stripe: Stripe,
  customerId: string
): Promise<ActiveSubscriptionCheckResult> {
  const trimmedId = customerId?.trim();
  if (!trimmedId) {
    return {
      hasActive: false,
      activeSubscriptions: [],
      summary: { activeCount: 0, trialingCount: 0, subscriptionIds: [] },
    };
  }

  try {
    // Query for active subscriptions
    const activeList = await stripe.subscriptions.list({
      customer: trimmedId,
      status: 'active',
      limit: 10,
    });

    // Query for trialing subscriptions
    const trialingList = await stripe.subscriptions.list({
      customer: trimmedId,
      status: 'trialing',
      limit: 10,
    });

    const allActive = [...activeList.data, ...trialingList.data];
    const activeCount = activeList.data.length;
    const trialingCount = trialingList.data.length;

    return {
      hasActive: allActive.length > 0,
      activeSubscriptions: allActive,
      summary: {
        activeCount,
        trialingCount,
        subscriptionIds: allActive.map(s => s.id),
      },
    };
  } catch (error) {
    // If Stripe API call fails, log error and return safe default (no active)
    // This prevents blocking legitimate users due to Stripe API issues
    console.error('[pricing] checkActiveSubscriptions: Stripe API error', {
      customerId: trimmedId.slice(-8),
      error: error instanceof Error ? error.message : String(error),
    });

    // Return empty result - calling code should handle this gracefully
    return {
      hasActive: false,
      activeSubscriptions: [],
      summary: { activeCount: 0, trialingCount: 0, subscriptionIds: [] },
    };
  }
}

/**
 * Checks if a customer has multiple active subscriptions (edge case alert).
 * Used in webhooks to detect and log duplicate subscription scenarios.
 *
 * @param stripe - Stripe instance
 * @param customerId - Stripe customer ID (cus_...)
 * @returns True if customer has 2+ active/trialing subscriptions
 */
export async function hasMultipleActiveSubscriptions(
  stripe: Stripe,
  customerId: string
): Promise<boolean> {
  const result = await checkActiveSubscriptions(stripe, customerId);
  return result.activeSubscriptions.length > 1;
}
