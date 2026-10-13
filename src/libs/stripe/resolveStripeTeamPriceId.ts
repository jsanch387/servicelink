import type { BillingInterval } from '@/features/pricing/types';

/**
 * Stripe Price ID for Team. New checkouts use it directly. An existing Pro
 * subscription moves onto it only after the owner confirms the charge.
 */
export function resolveStripeTeamPriceId(
  interval: BillingInterval
): string | null {
  if (interval === 'year') {
    return process.env.STRIPE_TEAM_YEARLY_PRICE_ID?.trim() || null;
  }
  return process.env.STRIPE_TEAM_PRICE_ID?.trim() || null;
}
