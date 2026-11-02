import type Stripe from 'stripe';

export function sumStripeBalanceCents(
  buckets: Stripe.Balance.Available[] | Stripe.Balance.Pending[] | undefined,
  currency = 'usd'
): number {
  const code = currency.trim().toLowerCase();
  let total = 0;
  for (const bucket of buckets ?? []) {
    if (bucket.currency?.trim().toLowerCase() !== code) continue;
    if (typeof bucket.amount === 'number') {
      total += bucket.amount;
    }
  }
  return total;
}
