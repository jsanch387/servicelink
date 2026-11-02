/**
 * One Stripe Customer → at most one open ServiceLink Pro subscription.
 * Server-only. Do not import from client code.
 */

import type Stripe from 'stripe';

/** Statuses that still bill or retry — not canceled / expired. */
export const OPEN_PLATFORM_SUBSCRIPTION_STATUSES = new Set<string>([
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'incomplete',
  'paused',
]);

const HEALTHY_PLATFORM_SUBSCRIPTION_STATUSES = new Set<string>([
  'active',
  'trialing',
]);

export type OpenSubscriptionRef = {
  id: string;
  status: string;
};

export type ProCheckoutDecision =
  | { action: 'new_subscription' }
  | { action: 'block_healthy'; keeperId: string; extraIds: string[] }
  | { action: 'resume'; subscriptionId: string; extraIds: string[] };

/**
 * This customer only: which open Pro sub to keep, if any.
 * Canceled / incomplete_expired are ignored so a real resubscribe can start Checkout.
 */
export function decideProCheckoutAction(
  openSubs: ReadonlyArray<OpenSubscriptionRef>,
  profileSubscriptionId?: string | null
): ProCheckoutDecision {
  if (openSubs.length === 0) {
    return { action: 'new_subscription' };
  }

  const profileId = profileSubscriptionId?.trim() || '';
  const healthy = openSubs.filter(sub =>
    HEALTHY_PLATFORM_SUBSCRIPTION_STATUSES.has(sub.status)
  );

  if (healthy.length > 0) {
    const keeper = healthy.find(sub => sub.id === profileId) ?? healthy[0];
    if (!keeper) {
      return { action: 'new_subscription' };
    }
    return {
      action: 'block_healthy',
      keeperId: keeper.id,
      extraIds: openSubs.filter(sub => sub.id !== keeper.id).map(sub => sub.id),
    };
  }

  const target = openSubs.find(sub => sub.id === profileId) ?? openSubs[0];
  return {
    action: 'resume',
    subscriptionId: target.id,
    extraIds: openSubs.filter(sub => sub.id !== target.id).map(sub => sub.id),
  };
}

/**
 * Lists non-canceled subscriptions on this Stripe customer (platform Pro).
 * Throws if Stripe errors — callers with a customer id must not create a new sub.
 */
export async function listOpenPlatformSubscriptions(
  stripe: Stripe,
  customerId: string
): Promise<Stripe.Subscription[]> {
  const trimmedId = customerId?.trim();
  if (!trimmedId) return [];

  const listed = await stripe.subscriptions.list({
    customer: trimmedId,
    status: 'all',
    limit: 20,
  });

  return listed.data.filter(sub =>
    OPEN_PLATFORM_SUBSCRIPTION_STATUSES.has(sub.status)
  );
}

export async function reconcileExtraPlatformProSubscriptions(
  stripe: Stripe,
  customerId: string,
  preferredKeeperId?: string | null
): Promise<{ keeperId: string | null; canceledIds: string[] }> {
  const open = await listOpenPlatformSubscriptions(stripe, customerId);
  const decision = decideProCheckoutAction(open, preferredKeeperId);
  if (decision.action === 'new_subscription') {
    return { keeperId: null, canceledIds: [] };
  }
  const keeperId =
    decision.action === 'block_healthy'
      ? decision.keeperId
      : decision.subscriptionId;
  if (decision.extraIds.length === 0) {
    return { keeperId, canceledIds: [] };
  }
  const canceledIds = await cancelExtraPlatformProSubscriptions(
    stripe,
    decision.extraIds
  );
  return { keeperId, canceledIds };
}

/**
 * Void open invoices (stops Smart Retries) then cancel leftover subs immediately.
 */
export async function cancelExtraPlatformProSubscriptions(
  stripe: Stripe,
  extraSubscriptionIds: string[]
): Promise<string[]> {
  const canceledIds: string[] = [];

  for (const rawId of extraSubscriptionIds) {
    const subscriptionId = rawId.trim();
    if (!subscriptionId) continue;

    try {
      const { data: openInvoices } = await stripe.invoices.list({
        subscription: subscriptionId,
        status: 'open',
        limit: 10,
      });
      for (const invoice of openInvoices) {
        if (invoice.status !== 'open' || !invoice.id) continue;
        try {
          await stripe.invoices.voidInvoice(invoice.id);
        } catch (voidErr) {
          console.warn('[pricing] void extra Pro invoice failed', {
            subscriptionIdSuffix: subscriptionId.slice(-8),
            invoiceIdSuffix: invoice.id.slice(-8),
            voidErr,
          });
        }
      }

      await stripe.subscriptions.cancel(subscriptionId);
      canceledIds.push(subscriptionId);
    } catch (cancelErr) {
      const message =
        cancelErr instanceof Error ? cancelErr.message : String(cancelErr);
      const alreadyGone = /no such subscription|resource_missing/i.test(
        message
      );
      if (alreadyGone) {
        canceledIds.push(subscriptionId);
        continue;
      }
      console.error('[pricing] cancel extra platform Pro subscription failed', {
        subscriptionIdSuffix: subscriptionId.slice(-8),
        cancelErr,
      });
    }
  }

  return canceledIds;
}
