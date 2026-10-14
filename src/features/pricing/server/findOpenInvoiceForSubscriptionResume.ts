import type Stripe from 'stripe';

const RESUMABLE_SUBSCRIPTION_STATUSES = new Set<
  Stripe.Subscription.Status | string
>(['past_due', 'unpaid', 'incomplete', 'paused']);

/**
 * Subscription states where we should collect payment on the **existing**
 * Stripe Subscription instead of creating a new one.
 */
export function isSubscriptionResumableViaInvoice(
  status: Stripe.Subscription.Status | string | null | undefined
): boolean {
  if (!status || typeof status !== 'string') return false;
  return RESUMABLE_SUBSCRIPTION_STATUSES.has(status);
}

/** Open invoice the customer can pay on Stripe's hosted invoice page. */
export type PayableOpenInvoice = {
  invoiceId: string;
  hostedInvoiceUrl: string;
};

function hostedInvoicePaymentUrl(
  invoice: Stripe.Invoice
): PayableOpenInvoice | null {
  if (invoice.status !== 'open' || (invoice.amount_due ?? 0) <= 0) {
    return null;
  }

  const invoiceId = invoice.id.trim();
  const hostedInvoiceUrl = invoice.hosted_invoice_url?.trim() ?? '';
  if (!invoiceId || !hostedInvoiceUrl) return null;

  try {
    if (new URL(hostedInvoiceUrl).protocol !== 'https:') return null;
  } catch {
    return null;
  }

  return { invoiceId, hostedInvoiceUrl };
}

/**
 * Open invoice with a Stripe-hosted payment URL for this subscription.
 * Checkout Sessions cannot take an existing invoice id, so callers redirect
 * here instead of creating a new subscription.
 */
export async function findPayableOpenInvoiceForSubscription(
  stripe: Stripe,
  subscriptionId: string
): Promise<PayableOpenInvoice | null> {
  const subId = subscriptionId.trim();
  if (!subId) return null;

  try {
    const sub = await stripe.subscriptions.retrieve(subId, {
      expand: ['latest_invoice'],
    });

    const latest = sub.latest_invoice;
    try {
      const latestInvoice =
        typeof latest === 'string'
          ? await stripe.invoices.retrieve(latest)
          : latest;
      if (latestInvoice) {
        const payable = hostedInvoicePaymentUrl(latestInvoice);
        if (payable) return payable;
      }
    } catch (latestErr) {
      console.warn(
        '[pricing] findPayableOpenInvoiceForSubscription: latest invoice lookup failed',
        { subscriptionIdSuffix: subId.slice(-8), latestErr }
      );
    }

    const { data: openList } = await stripe.invoices.list({
      subscription: subId,
      status: 'open',
      limit: 10,
    });
    for (const inv of openList) {
      const payable = hostedInvoicePaymentUrl(inv);
      if (payable) return payable;
    }
  } catch (e) {
    console.warn(
      '[pricing] findPayableOpenInvoiceForSubscription: invoice lookup failed',
      { subscriptionIdSuffix: subId.slice(-8), e }
    );
  }

  return null;
}
