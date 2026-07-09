import type { BillingInterval } from '@/features/pricing/types';
import type Stripe from 'stripe';

/** Reads month/year from the subscription's primary price. */
export function resolveBillingIntervalFromStripeSubscription(
  subscription: Stripe.Subscription
): BillingInterval {
  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  return interval === 'year' ? 'year' : 'month';
}

/** From Checkout session metadata when present (`billingInterval: "month" | "year"`). */
export function parseBillingIntervalFromCheckoutMetadata(
  metadata: Stripe.Metadata | null | undefined
): BillingInterval | null {
  const raw = metadata?.billingInterval?.trim();
  if (raw === 'year') return 'year';
  if (raw === 'month') return 'month';
  return null;
}
