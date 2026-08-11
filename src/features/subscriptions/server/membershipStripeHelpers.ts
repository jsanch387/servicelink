import type Stripe from 'stripe';

const MEMBERSHIP_STATUSES = new Set([
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
]);

const MEMBERSHIP_INVOICE_STATUSES = new Set([
  'draft',
  'open',
  'paid',
  'uncollectible',
  'void',
]);

const MEMBERSHIP_INTERVALS = new Set(['day', 'week', 'month', 'year']);

export function isMembershipCheckoutKind(
  metadata: Stripe.Metadata | null | undefined
): boolean {
  return metadata?.kind === 'membership_checkout';
}

export function unixSecondsToIso(
  unix: number | null | undefined
): string | null {
  if (unix == null || !Number.isFinite(unix)) return null;
  return new Date(unix * 1000).toISOString();
}

export function mapMembershipSubscriptionStatus(
  status: string | null | undefined
): string {
  const s = (status ?? '').trim();
  return MEMBERSHIP_STATUSES.has(s) ? s : 'incomplete';
}

export function mapMembershipInvoiceStatus(
  status: string | null | undefined
): string {
  const s = (status ?? '').trim();
  return MEMBERSHIP_INVOICE_STATUSES.has(s) ? s : 'open';
}

export function membershipSubscriptionPeriodBounds(
  subscription: Stripe.Subscription
): {
  startUnix: number | null;
  endUnix: number | null;
} {
  const items = subscription.items?.data;
  if (items && items.length > 0) {
    return {
      startUnix: Math.min(...items.map(i => i.current_period_start)),
      endUnix: Math.max(...items.map(i => i.current_period_end)),
    };
  }
  const legacy = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  return {
    startUnix: legacy.current_period_start ?? null,
    endUnix: legacy.current_period_end ?? null,
  };
}

export function membershipBillingSnapshot(subscription: Stripe.Subscription): {
  amountCents: number;
  currency: string;
  intervalUnit: string | null;
  intervalCount: number | null;
} {
  const item = subscription.items?.data?.[0];
  const price = item?.price;
  const amount =
    typeof price?.unit_amount === 'number' && Number.isFinite(price.unit_amount)
      ? Math.max(0, Math.round(price.unit_amount))
      : 0;
  const currency =
    (price?.currency ?? subscription.currency ?? 'usd').trim().toLowerCase() ||
    'usd';
  const interval = price?.recurring?.interval?.trim() ?? '';
  const intervalUnit = MEMBERSHIP_INTERVALS.has(interval) ? interval : null;
  const count = price?.recurring?.interval_count;
  const intervalCount =
    typeof count === 'number' && Number.isFinite(count) && count >= 1
      ? Math.round(count)
      : null;
  return { amountCents: amount, currency, intervalUnit, intervalCount };
}

export function stripeIdFromExpandable(
  value: string | { id?: string } | null | undefined
): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object' && typeof value.id === 'string') {
    const id = value.id.trim();
    return id || null;
  }
  return null;
}

export function stripeSubscriptionIdFromInvoice(
  invoice: Stripe.Invoice
): string | null {
  const withSub = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };
  return stripeIdFromExpandable(withSub.subscription);
}
