/**
 * Applies platform Pro Checkout session completion to `profiles`.
 * Shared by the Stripe webhook for subscription Checkout (not booking checkout).
 */

import { retrieveSubscriptionCurrentPeriodEndIso } from '@/features/pricing/server/stripeSubscriptionPeriodEnd';
import {
  parseBillingIntervalFromCheckoutMetadata,
  resolveBillingIntervalFromStripeSubscription,
} from '@/features/pricing/server/resolveSubscriptionBillingInterval';
import { updateProfileFromCheckout } from '@/features/pricing/server/updateProfileFromCheckout';
import { onboardingStripeDebug } from '@/libs/stripe/onboardingStripeDebugLog';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

/**
 * Applies the same profile updates as `checkout.session.completed`
 * for a **platform Pro subscription** Checkout session (not booking checkout).
 * Call only after verifying `session.metadata.userId` matches the caller.
 */
export async function applyPlatformProCheckoutSessionCompleted(
  supabase: SupabaseClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<{ success: boolean; error?: string }> {
  const userId = session.metadata?.userId as string | undefined;
  if (!userId?.trim()) {
    onboardingStripeDebug('apply-checkout', 'missing metadata.userId', {
      sessionIdSuffix: session.id?.slice(-8),
    });
    return { success: false, error: 'session missing metadata.userId' };
  }

  onboardingStripeDebug('apply-checkout', 'start', {
    userId: userId.trim(),
    sessionIdSuffix: session.id?.slice(-8),
    source:
      typeof session.metadata?.source === 'string'
        ? session.metadata.source
        : null,
    status: session.status,
  });

  let stripeCustomerId =
    typeof session.customer === 'string'
      ? session.customer
      : (session.customer?.id ?? null);
  let stripeSubscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription?.id ?? null);

  /** Invoice Checkout (`mode: 'payment'`) pays an existing subscription — no `session.subscription` id. */
  if (!stripeSubscriptionId && session.mode === 'payment') {
    const invRef = session.invoice;
    const invoiceId =
      typeof invRef === 'string' ? invRef : (invRef?.id ?? null);
    if (invoiceId) {
      try {
        const invoice = await stripe.invoices.retrieve(invoiceId, {
          expand: ['customer', 'parent.subscription_details.subscription'],
        });
        const legacySub = (
          invoice as Stripe.Invoice & {
            subscription?: string | Stripe.Subscription | null;
          }
        ).subscription;
        if (legacySub) {
          stripeSubscriptionId =
            typeof legacySub === 'string' ? legacySub : (legacySub.id ?? null);
        } else {
          const parent = invoice.parent;
          const subFromParent =
            parent?.type === 'subscription_details'
              ? parent.subscription_details?.subscription
              : null;
          stripeSubscriptionId =
            typeof subFromParent === 'string'
              ? subFromParent
              : subFromParent && typeof subFromParent === 'object'
                ? subFromParent.id
                : null;
        }
        if (!stripeCustomerId) {
          const cust = invoice.customer;
          stripeCustomerId =
            typeof cust === 'string'
              ? cust
              : cust && typeof cust === 'object'
                ? (cust as Stripe.Customer).id
                : null;
        }
      } catch (invErr) {
        console.warn(
          '[applyPlatformProCheckoutSessionCompleted] invoice.retrieve failed',
          { invoiceIdSuffix: invoiceId.slice(-8), invErr }
        );
      }
    }
  }

  if (!stripeSubscriptionId) {
    onboardingStripeDebug('apply-checkout', 'missing subscription id', {
      sessionIdSuffix: session.id?.slice(-8),
      mode: session.mode,
    });
    return {
      success: false,
      error: 'Checkout session is missing a subscription to sync',
    };
  }

  let currentPeriodEnd: string | null = null;
  let subscriptionStatus: string | null = null;
  let subscriptionBillingInterval =
    parseBillingIntervalFromCheckoutMetadata(session.metadata) ?? null;
  if (stripeSubscriptionId) {
    try {
      const subscription =
        await stripe.subscriptions.retrieve(stripeSubscriptionId);
      subscriptionStatus = subscription.status ?? null;
      subscriptionBillingInterval =
        resolveBillingIntervalFromStripeSubscription(subscription);
    } catch (retrieveErr) {
      console.warn(
        '[applyPlatformProCheckoutSessionCompleted] subscriptions.retrieve status failed',
        {
          stripeSubscriptionIdSuffix: stripeSubscriptionId.slice(-8),
          retrieveErr,
        }
      );
    }
    currentPeriodEnd = await retrieveSubscriptionCurrentPeriodEndIso(
      stripe,
      stripeSubscriptionId
    );
  }

  const result = await updateProfileFromCheckout(supabase, {
    userId: userId.trim(),
    stripeCustomerId,
    stripeSubscriptionId,
    currentPeriodEnd,
    subscriptionStatus,
    subscriptionBillingInterval,
  });

  if (!result.success) {
    onboardingStripeDebug(
      'apply-checkout',
      'updateProfileFromCheckout failed',
      {
        userId: userId.trim(),
        error: result.error,
      }
    );
    return { success: false, error: result.error };
  }

  onboardingStripeDebug('apply-checkout', 'done', {
    userId: userId.trim(),
    stripeSubscriptionIdSuffix: stripeSubscriptionId?.slice(-8) ?? null,
    subscriptionStatus,
  });

  return { success: true };
}
