import { getStripeConnectClient } from '@/libs/stripe';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import {
  logMemberships,
  shortIdForLog,
  shortStripeIdForLog,
} from './membershipsTransactionLog';
import { isMembershipCheckoutKind } from './membershipStripeHelpers';
import { recordMembershipEvent } from './recordMembershipEvent';
import { sendMembershipPeriodVisitRemindersIfApplicable } from './sendMembershipPeriodVisitRemindersIfApplicable';
import {
  findMembershipByStripeSubscription,
  upsertCustomerMembershipFromSubscription,
} from './upsertCustomerMembershipFromSubscription';

async function resolveMembershipBusinessContext(
  supabase: SupabaseClient<Database>,
  args: {
    stripeAccountId: string;
    subscription: Stripe.Subscription;
  }
): Promise<{
  businessId: string;
  planId: string | null;
  planPriceId: string | null;
} | null> {
  const meta = args.subscription.metadata;
  if (isMembershipCheckoutKind(meta)) {
    const businessId = meta?.businessId?.trim() ?? '';
    if (businessId) {
      return {
        businessId,
        planId: meta?.membershipPlanId?.trim() || null,
        planPriceId: meta?.membershipPlanPriceId?.trim() || null,
      };
    }
  }

  const existing = await findMembershipByStripeSubscription(supabase, {
    stripeAccountId: args.stripeAccountId,
    stripeSubscriptionId: args.subscription.id,
  });
  if (!existing) return null;
  return {
    businessId: existing.business_id,
    planId: null,
    planPriceId: null,
  };
}

/**
 * Connect `customer.subscription.updated` / `deleted` for memberships.
 * Returns `handled: false` when this subscription is not a membership.
 */
export async function applyMembershipSubscriptionLifecycle(
  supabase: SupabaseClient<Database>,
  args: {
    event: Stripe.Event;
    subscription: Stripe.Subscription;
    kind: 'updated' | 'deleted';
  }
): Promise<{ handled: boolean }> {
  const { event, subscription } = args;
  const stripeAccountId =
    typeof event.account === 'string' ? event.account.trim() : '';
  if (!stripeAccountId) {
    // Platform Pro subscriptions have no event.account
    return { handled: false };
  }

  const isMembershipMeta = isMembershipCheckoutKind(subscription.metadata);
  const existing = isMembershipMeta
    ? null
    : await findMembershipByStripeSubscription(supabase, {
        stripeAccountId,
        stripeSubscriptionId: subscription.id,
      });

  if (!isMembershipMeta && !existing) {
    return { handled: false };
  }

  let fresh = subscription;
  try {
    const stripe = getStripeConnectClient(stripeAccountId);
    fresh = await stripe.subscriptions.retrieve(subscription.id, {
      expand: ['default_payment_method', 'latest_invoice'],
    });
  } catch (err) {
    logMemberships(event.id, 'warn', 'subscription.retrieve_failed', {
      stripeAccountId: shortStripeIdForLog(stripeAccountId),
      stripeSubscriptionId: shortStripeIdForLog(subscription.id),
      reason: 'Using event payload after Connect retrieve failed',
      error: err instanceof Error ? err.message : 'unknown',
    });
  }

  const ctx = await resolveMembershipBusinessContext(supabase, {
    stripeAccountId,
    subscription: fresh,
  });
  if (!ctx) {
    logMemberships(event.id, 'error', 'subscription.missing_business', {
      stripeAccountId: shortStripeIdForLog(stripeAccountId),
      stripeSubscriptionId: shortStripeIdForLog(subscription.id),
      reason: 'Could not resolve business for membership subscription',
    });
    return { handled: true };
  }

  const upsert = await upsertCustomerMembershipFromSubscription(supabase, {
    stripeAccountId,
    subscription: fresh,
    businessId: ctx.businessId,
    planId: ctx.planId,
    planPriceId: ctx.planPriceId,
  });

  if (!upsert.ok) {
    return { handled: true };
  }

  await recordMembershipEvent(supabase, {
    businessId: ctx.businessId,
    membershipId: upsert.membershipId,
    eventType: args.kind === 'deleted' ? 'canceled' : 'subscription_updated',
    stripeEventId: event.id,
    stripeAccountId,
    summary:
      args.kind === 'deleted'
        ? 'Membership subscription ended'
        : 'Membership subscription updated',
    payload: {
      subscriptionId: fresh.id,
      status: fresh.status,
      cancelAtPeriodEnd: Boolean(fresh.cancel_at_period_end),
    },
  });

  if (args.kind === 'updated') {
    try {
      await sendMembershipPeriodVisitRemindersIfApplicable(supabase, {
        membershipId: upsert.membershipId,
        stripeEventId: event.id,
      });
    } catch (err) {
      logMemberships(event.id, 'warn', 'visit_reminder.unexpected', {
        membershipId: shortIdForLog(upsert.membershipId),
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
  }

  return { handled: true };
}
