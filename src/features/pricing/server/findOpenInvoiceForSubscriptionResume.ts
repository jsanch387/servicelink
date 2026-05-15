import type Stripe from 'stripe';

const RESUMABLE_SUBSCRIPTION_STATUSES = new Set<
  Stripe.Subscription.Status | string
>(['past_due', 'unpaid', 'incomplete', 'paused']);

/**
 * Subscription states where we should collect payment on the **existing**
 * Stripe Subscription (invoice Checkout) instead of creating a new subscription.
 */
export function isSubscriptionResumableViaInvoice(
  status: Stripe.Subscription.Status | string | null | undefined
): boolean {
  if (!status || typeof status !== 'string') return false;
  return RESUMABLE_SUBSCRIPTION_STATUSES.has(status);
}

/**
 * Returns an **open** invoice id with amount due, for Checkout `mode: 'payment'`.
 * Stripe Link and cards both work on that hosted invoice page.
 */
export async function findOpenInvoiceIdForSubscriptionResume(
  stripe: Stripe,
  subscriptionId: string
): Promise<string | null> {
  const subId = subscriptionId.trim();
  if (!subId) return null;

  try {
    const sub = await stripe.subscriptions.retrieve(subId, {
      expand: ['latest_invoice'],
    });

    const latest = sub.latest_invoice;
    if (typeof latest === 'string') {
      const inv = await stripe.invoices.retrieve(latest);
      if (inv.status === 'open' && (inv.amount_due ?? 0) > 0) {
        return inv.id;
      }
    } else if (latest && typeof latest === 'object') {
      const maybeDeleted = latest as { deleted?: boolean };
      if (!maybeDeleted.deleted && 'id' in latest) {
        const inv = latest as Stripe.Invoice;
        if (inv.status === 'open' && (inv.amount_due ?? 0) > 0) {
          return inv.id;
        }
      }
    }

    const { data: openList } = await stripe.invoices.list({
      subscription: subId,
      status: 'open',
      limit: 10,
    });
    for (const inv of openList) {
      if (inv.status === 'open' && (inv.amount_due ?? 0) > 0) {
        return inv.id;
      }
    }
  } catch (e) {
    console.warn(
      '[pricing] findOpenInvoiceForSubscriptionResume: invoice lookup failed',
      { subscriptionIdSuffix: subId.slice(-8), e }
    );
  }

  return null;
}
