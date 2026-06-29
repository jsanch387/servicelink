import { getStripePlatform } from '@/libs/stripe';

/** e.g. 1000 → "$10", 2000 → "$20" */
export function formatSubscriptionUnitAmountCents(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars)
    ? `$${dollars.toFixed(0)}`
    : `$${dollars.toFixed(2)}`;
}

/**
 * Reads the recurring unit amount from an active Stripe subscription.
 * Used so grandfathered subscribers (e.g. legacy $10/mo) see their real rate
 * in Settings while marketing copy shows the current list price ($20).
 */
export async function getSubscriptionMonthlyPriceDisplay(
  subscriptionId: string
): Promise<string | null> {
  const id = subscriptionId.trim();
  if (!id) return null;

  try {
    const stripe = getStripePlatform();
    const sub = await stripe.subscriptions.retrieve(id);
    const unitAmount = sub.items.data[0]?.price?.unit_amount;
    if (unitAmount == null || unitAmount < 0) return null;
    return formatSubscriptionUnitAmountCents(unitAmount);
  } catch {
    return null;
  }
}
