import type { BillingInterval } from '@/features/pricing/types';

/**
 * Resolves Stripe Price ID for Pro checkout from billing interval env vars.
 */
export function resolveStripeProPriceId(
  interval: BillingInterval
): string | null {
  if (interval === 'year') {
    return process.env.STRIPE_PRO_YEARLY_PRICE_ID?.trim() || null;
  }
  return process.env.STRIPE_PRO_PRICE_ID?.trim() || null;
}
