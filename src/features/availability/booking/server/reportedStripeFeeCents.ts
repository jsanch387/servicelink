import type Stripe from 'stripe';

/**
 * Stripe's processing fee once the balance transaction exists.
 * A string id or a missing transaction means Stripe has not reported it yet.
 * 0 is a real report: Stripe took nothing.
 */
export function reportedStripeFeeCents(
  balanceTransaction: Stripe.BalanceTransaction | string | null | undefined
): number | null {
  if (!balanceTransaction || typeof balanceTransaction === 'string')
    return null;
  const fee = balanceTransaction.fee;
  if (typeof fee !== 'number' || !Number.isInteger(fee) || fee < 0) return null;
  return fee;
}
