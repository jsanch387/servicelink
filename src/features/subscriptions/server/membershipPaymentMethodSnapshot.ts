import type Stripe from 'stripe';
import { stripeIdFromExpandable } from './membershipStripeHelpers';

export type MembershipPaymentMethodSnapshot = {
  brand: string | null;
  last4: string | null;
};

export function formatMembershipPaymentMethodLabel(
  brand: string | null | undefined,
  last4: string | null | undefined
): string | undefined {
  const b = (brand ?? '').trim();
  const l = (last4 ?? '').trim();
  if (!b && !l) return undefined;
  const brandLabel = b
    ? b.charAt(0).toUpperCase() + b.slice(1).toLowerCase()
    : 'Card';
  if (l) return `${brandLabel} ••${l}`;
  return brandLabel;
}

export function paymentMethodSnapshotFromStripe(
  paymentMethod: Stripe.PaymentMethod | string | null | undefined
): MembershipPaymentMethodSnapshot {
  if (!paymentMethod || typeof paymentMethod === 'string') {
    return { brand: null, last4: null };
  }
  const card = paymentMethod.card;
  if (!card) return { brand: null, last4: null };
  return {
    brand: typeof card.brand === 'string' ? card.brand.trim() || null : null,
    last4: typeof card.last4 === 'string' ? card.last4.trim() || null : null,
  };
}

export function invoiceHealthFromStripeInvoice(
  invoice: Stripe.Invoice | string | null | undefined
): {
  latestInvoiceId: string | null;
  lastInvoiceStatus: string | null;
  paidAtUnix: number | null;
  amountPaidCents: number | null;
} {
  if (!invoice || typeof invoice === 'string') {
    return {
      latestInvoiceId: typeof invoice === 'string' ? invoice : null,
      lastInvoiceStatus: null,
      paidAtUnix: null,
      amountPaidCents: null,
    };
  }
  return {
    latestInvoiceId: invoice.id?.trim() || null,
    lastInvoiceStatus: invoice.status?.trim() || null,
    paidAtUnix: invoice.status_transitions?.paid_at ?? null,
    amountPaidCents:
      typeof invoice.amount_paid === 'number'
        ? Math.max(0, Math.round(invoice.amount_paid))
        : null,
  };
}

/** Expand path for subscription retrieves used by membership webhooks / enrich. */
export const MEMBERSHIP_SUBSCRIPTION_EXPAND = [
  'default_payment_method',
  'latest_invoice',
] as const;

export function defaultPaymentMethodFromSubscription(
  subscription: Stripe.Subscription
): Stripe.PaymentMethod | string | null {
  const pm = subscription.default_payment_method;
  if (!pm) return null;
  if (typeof pm === 'string') return pm;
  return pm;
}

export function latestInvoiceFromSubscription(
  subscription: Stripe.Subscription
): Stripe.Invoice | string | null {
  const inv = subscription.latest_invoice;
  if (!inv) return null;
  if (typeof inv === 'string') return inv;
  return inv;
}

export function customerIdFromSubscription(
  subscription: Stripe.Subscription
): string | null {
  return stripeIdFromExpandable(subscription.customer);
}
