import type Stripe from 'stripe';

/**
 * True when the subscription will end after the current period without renewing:
 * either `cancel_at_period_end` (classic) or a **future** `cancel_at` timestamp
 * (Basil / flexible billing often relies on `cancel_at` instead of the boolean).
 *
 * @see https://docs.stripe.com/changelog/basil/2025-05-28/cancel-at-enums
 */
export function subscriptionIsScheduledCancelWithoutRenewal(
  sub: Stripe.Subscription
): boolean {
  if (sub.cancel_at_period_end === true) {
    return true;
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const cancelAt = sub.cancel_at;
  if (cancelAt != null && typeof cancelAt === 'number' && cancelAt > nowSec) {
    return true;
  }
  return false;
}
