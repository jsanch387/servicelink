import { getStripeConnectClient } from '@/libs/stripe';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OwnerSubscriber } from '../types/ownerSubscriptionPlan';
import {
  logMemberships,
  shortIdForLog,
  shortStripeIdForLog,
  stripeErrorForLogs,
} from './membershipsTransactionLog';
import { mapCustomerMembershipToOwnerSubscriber } from './mapCustomerMembershipToOwnerSubscriber';
import {
  customerMembershipsOf,
  membershipPlansOf,
} from './membershipTablesQuery';
import { recordMembershipEvent } from './recordMembershipEvent';
import { upsertCustomerMembershipFromSubscription } from './upsertCustomerMembershipFromSubscription';

export async function cancelOwnerCustomerMembership(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    membershipId: string;
    mode: 'at_period_end' | 'immediate';
  }
): Promise<
  | { ok: true; subscriber: OwnerSubscriber }
  | { ok: false; error: string; status: number }
> {
  const businessId = args.businessId.trim();
  const membershipId = args.membershipId.trim();
  if (!businessId || !membershipId) {
    return { ok: false, error: 'Missing id.', status: 400 };
  }

  const { data: row, error } = await customerMembershipsOf(supabase)
    .select('*')
    .eq('business_id', businessId)
    .eq('id', membershipId)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: 'Subscriber not found.', status: 404 };
  }

  const stripeAccountId = String(row.stripe_account_id ?? '').trim();
  const stripeSubscriptionId = String(row.stripe_subscription_id ?? '').trim();
  if (!stripeAccountId || !stripeSubscriptionId) {
    return {
      ok: false,
      error: 'Stripe subscription is missing for this member.',
      status: 400,
    };
  }

  if (row.status === 'canceled') {
    return { ok: false, error: 'Already canceled.', status: 409 };
  }

  try {
    const stripe = getStripeConnectClient(stripeAccountId);
    let subscription;
    if (args.mode === 'immediate') {
      subscription = await stripe.subscriptions.cancel(stripeSubscriptionId);
    } else {
      subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    const upsert = await upsertCustomerMembershipFromSubscription(supabase, {
      stripeAccountId,
      subscription,
      businessId,
      planId: row.plan_id,
      planPriceId: row.plan_price_id,
    });

    if (!upsert.ok) {
      return { ok: false, error: upsert.error, status: 500 };
    }

    await recordMembershipEvent(supabase, {
      businessId,
      membershipId,
      eventType: args.mode === 'immediate' ? 'canceled' : 'cancel_requested',
      stripeAccountId,
      summary:
        args.mode === 'immediate'
          ? 'Owner canceled membership immediately'
          : 'Owner requested cancel at period end',
      payload: { mode: args.mode, subscriptionId: stripeSubscriptionId },
    });

    let planName = 'Plan';
    if (row.plan_id) {
      const { data: plan } = await membershipPlansOf(supabase)
        .select('name')
        .eq('id', row.plan_id)
        .maybeSingle();
      if (plan?.name) planName = String(plan.name);
    }

    const { data: fresh } = await customerMembershipsOf(supabase)
      .select('*')
      .eq('id', membershipId)
      .maybeSingle();

    return {
      ok: true,
      subscriber: mapCustomerMembershipToOwnerSubscriber(
        fresh ?? row,
        planName
      ),
    };
  } catch (err) {
    logMemberships(undefined, 'error', 'cancel.stripe_failed', {
      businessId: shortIdForLog(businessId),
      membershipId: shortIdForLog(membershipId),
      stripeAccountId: shortStripeIdForLog(stripeAccountId),
      stripeSubscriptionId: shortStripeIdForLog(stripeSubscriptionId),
      mode: args.mode,
      ...stripeErrorForLogs(err),
    });
    return {
      ok: false,
      error: 'Could not cancel this subscription in Stripe.',
      status: 502,
    };
  }
}
