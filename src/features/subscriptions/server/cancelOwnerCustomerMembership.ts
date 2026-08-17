import { getStripeConnectClient } from '@/libs/stripe';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OwnerSubscriber } from '../types/ownerSubscriptionPlan';
import { getOwnerCustomerMembership } from './listOwnerCustomerMemberships';
import {
  logMemberships,
  shortIdForLog,
  shortStripeIdForLog,
  stripeErrorForLogs,
} from './membershipsTransactionLog';
import { customerMembershipsOf } from './membershipTablesQuery';
import { recordMembershipEvent } from './recordMembershipEvent';
import { upsertCustomerMembershipFromSubscription } from './upsertCustomerMembershipFromSubscription';
import { isMembershipCancelScheduled } from './mapCustomerMembershipToOwnerSubscriber';
import { sendMembershipCanceledEmailIfApplicable } from './sendMembershipCanceledEmailIfApplicable';

function stripeErrorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const code = (err as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

export async function cancelOwnerCustomerMembership(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    membershipId: string;
    mode: 'at_period_end' | 'immediate';
  }
): Promise<
  | { ok: true; subscriber: OwnerSubscriber; alreadyCanceled?: boolean }
  | { ok: false; error: string; status: number }
> {
  const businessId = args.businessId.trim();
  const membershipId = args.membershipId.trim();
  if (!businessId || !membershipId) {
    return { ok: false, error: 'Missing id.', status: 400 };
  }

  // Owner session can SELECT only; verify ownership then write via service role.
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

  const admin = createSupabaseAdminClient();

  const returnFresh = async (alreadyCanceled?: boolean) => {
    const fresh = await getOwnerCustomerMembership(
      supabase,
      businessId,
      membershipId
    );
    if (!fresh.ok) {
      return { ok: false as const, error: fresh.error, status: fresh.status };
    }
    return {
      ok: true as const,
      subscriber: fresh.subscriber,
      alreadyCanceled,
    };
  };

  // Idempotent: DB already canceled / cancel scheduled — sync from Stripe and
  // return fresh subscriber so the UI updates without an error toast.
  if (row.status === 'canceled') {
    try {
      const stripe = getStripeConnectClient(stripeAccountId);
      const subscription =
        await stripe.subscriptions.retrieve(stripeSubscriptionId);
      await upsertCustomerMembershipFromSubscription(admin, {
        stripeAccountId,
        subscription,
        businessId,
        planId: row.plan_id,
        planPriceId: row.plan_price_id,
      });
    } catch {
      // Best-effort sync; still return current DB state.
    }
    return returnFresh(true);
  }

  if (args.mode === 'at_period_end' && isMembershipCancelScheduled(row)) {
    try {
      const stripe = getStripeConnectClient(stripeAccountId);
      const subscription =
        await stripe.subscriptions.retrieve(stripeSubscriptionId);
      await upsertCustomerMembershipFromSubscription(admin, {
        stripeAccountId,
        subscription,
        businessId,
        planId: row.plan_id,
        planPriceId: row.plan_price_id,
      });
    } catch {
      // Best-effort
    }
    return returnFresh(true);
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

    const upsert = await upsertCustomerMembershipFromSubscription(admin, {
      stripeAccountId,
      subscription,
      businessId,
      planId: row.plan_id,
      planPriceId: row.plan_price_id,
    });

    if (!upsert.ok) {
      return { ok: false, error: upsert.error, status: 500 };
    }

    await recordMembershipEvent(admin, {
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

    try {
      await sendMembershipCanceledEmailIfApplicable(admin, {
        membershipId,
        previouslyCanceling: false,
      });
    } catch {
      // Best-effort; webhook path also attempts send.
    }

    return returnFresh(false);
  } catch (err) {
    // Stripe may already be canceled from a prior attempt (e.g. upsert failed
    // after Stripe succeeded). Sync and treat as success.
    const code = stripeErrorCode(err);
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: unknown }).message ?? '')
        : '';
    const alreadyGone =
      code === 'resource_missing' ||
      /already\s+(been\s+)?cancel/i.test(message) ||
      /subscription.*cancel/i.test(message);

    if (alreadyGone) {
      try {
        const stripe = getStripeConnectClient(stripeAccountId);
        const subscription =
          await stripe.subscriptions.retrieve(stripeSubscriptionId);
        await upsertCustomerMembershipFromSubscription(admin, {
          stripeAccountId,
          subscription,
          businessId,
          planId: row.plan_id,
          planPriceId: row.plan_price_id,
        });
      } catch {
        // ignore
      }
      return returnFresh(true);
    }

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
