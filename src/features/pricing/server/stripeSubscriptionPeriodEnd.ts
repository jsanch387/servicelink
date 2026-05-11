/**
 * Stripe subscription billing period helpers (platform billing).
 * Used by the Stripe webhook and server routes that create subscriptions.
 */

import type Stripe from 'stripe';

/**
 * Current billing period end (unix seconds). Basil API stores period bounds on
 * subscription items; fall back to legacy subscription-level field if present.
 */
export function subscriptionCurrentPeriodEndUnix(
  subscription: Stripe.Subscription
): number | null {
  const items = subscription.items?.data;
  if (items && items.length > 0) {
    return Math.max(...items.map(i => i.current_period_end));
  }
  const legacy = subscription as Stripe.Subscription & {
    current_period_end?: number;
  };
  return legacy.current_period_end ?? null;
}

/** Best-effort: subscription can lag right after create — retry once before writing null period end. */
export async function retrieveSubscriptionCurrentPeriodEndIso(
  stripe: Stripe,
  subscriptionId: string
): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const periodEnd = subscriptionCurrentPeriodEndUnix(subscription);
      if (periodEnd != null) {
        return new Date(periodEnd * 1000).toISOString();
      }
    } catch (e) {
      console.error(
        `[stripeSubscriptionPeriodEnd] subscriptions.retrieve attempt ${attempt + 1} failed`,
        e
      );
    }
    if (attempt === 0) {
      await new Promise(r => setTimeout(r, 750));
    }
  }
  console.warn(
    '[stripeSubscriptionPeriodEnd] subscription period end still null after retrieve (will rely on customer.subscription.updated)'
  );
  return null;
}
