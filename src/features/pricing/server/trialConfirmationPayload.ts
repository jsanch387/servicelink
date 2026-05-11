/**
 * Canonical trial / Pro subscription snapshot for mobile and onboarding clients.
 * Merges `profiles` with Stripe `Subscription` when a subscription id exists.
 */

import { runOnboardingTrialBridgeAfterSubscribe } from '@/features/onboarding-v2/server/onboardingTrialBridgeAfterSubscribe';
import { retrieveSubscriptionCurrentPeriodEndIso } from '@/features/pricing/server/stripeSubscriptionPeriodEnd';
import { updateProfileFromCheckout } from '@/features/pricing/server/updateProfileFromCheckout';
import { onboardingStripeDebug } from '@/libs/stripe/onboardingStripeDebugLog';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

export type TrialConfirmationPayload = {
  user_id: string;
  onboarding_status: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  /** Billing period end from DB (ISO); aligns with Stripe after sync. */
  subscription_current_period_end: string | null;
  /** Fields read from Stripe `Subscription` (authoritative for trial window). */
  stripe: {
    subscription_id: string | null;
    status: string | null;
    trial_start: string | null;
    trial_end: string | null;
  };
};

function unixToIso(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
}

/**
 * Loads the current user's profile billing columns and enriches with Stripe
 * subscription trial dates when `stripe_subscription_id` is set.
 */
export async function buildTrialConfirmationPayload(
  supabase: SupabaseClient,
  stripe: Stripe,
  userId: string
): Promise<TrialConfirmationPayload | null> {
  if (!userId?.trim()) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error } = await (supabase as any)
    .from('profiles')
    .select(
      'user_id, onboarding_status, subscription_tier, subscription_status, stripe_customer_id, stripe_subscription_id, subscription_current_period_end'
    )
    .eq('user_id', userId.trim())
    .maybeSingle();

  if (error || !row) {
    onboardingStripeDebug('trial-payload', 'profile row missing', {
      userId: userId.trim(),
      error: error?.message,
    });
    return null;
  }

  const stripeSubscriptionId =
    typeof row.stripe_subscription_id === 'string'
      ? row.stripe_subscription_id.trim()
      : '';

  let stripeStatus: string | null = null;
  let trialStart: string | null = null;
  let trialEnd: string | null = null;

  if (stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      stripeStatus = sub.status ?? null;
      trialStart = unixToIso(sub.trial_start);
      trialEnd = unixToIso(sub.trial_end);
    } catch (e) {
      console.warn('[trialConfirmationPayload] subscriptions.retrieve failed', {
        userId: userId.trim(),
        stripeSubscriptionId,
        e,
      });
    }
  }

  const payload = {
    user_id: String(row.user_id ?? userId.trim()),
    onboarding_status:
      typeof row.onboarding_status === 'string' ? row.onboarding_status : null,
    subscription_tier:
      typeof row.subscription_tier === 'string' ? row.subscription_tier : null,
    subscription_status:
      typeof row.subscription_status === 'string'
        ? row.subscription_status
        : null,
    stripe_customer_id:
      typeof row.stripe_customer_id === 'string'
        ? row.stripe_customer_id.trim()
        : null,
    stripe_subscription_id: stripeSubscriptionId || null,
    subscription_current_period_end:
      typeof row.subscription_current_period_end === 'string'
        ? row.subscription_current_period_end
        : null,
    stripe: {
      subscription_id: stripeSubscriptionId || null,
      status: stripeStatus,
      trial_start: trialStart,
      trial_end: trialEnd,
    },
  };

  onboardingStripeDebug('trial-payload', 'built', {
    userId: userId.trim(),
    subscription_tier: payload.subscription_tier,
    subscription_status: payload.subscription_status,
    stripeStatus: payload.stripe.status,
    trialEnd: payload.stripe.trial_end,
    onboarding_status: payload.onboarding_status,
  });

  return payload;
}

/**
 * Applies the same profile + onboarding updates as `checkout.session.completed`
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

  const stripeCustomerId =
    typeof session.customer === 'string'
      ? session.customer
      : (session.customer?.id ?? null);
  const stripeSubscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription?.id ?? null);

  let currentPeriodEnd: string | null = null;
  let subscriptionStatus: string | null = null;
  if (stripeSubscriptionId) {
    try {
      const subscription =
        await stripe.subscriptions.retrieve(stripeSubscriptionId);
      subscriptionStatus = subscription.status ?? null;
    } catch (retrieveErr) {
      console.warn(
        '[applyPlatformProCheckoutSessionCompleted] subscriptions.retrieve status failed',
        { stripeSubscriptionId, retrieveErr }
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

  if (session.metadata?.source === 'onboarding_trial_bridge') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authResult = await (supabase as any).auth.admin.getUserById(
      userId.trim()
    );
    const userEmail = authResult?.data?.user?.email?.trim();

    const bridgeResult = await runOnboardingTrialBridgeAfterSubscribe(
      supabase,
      userId.trim(),
      userEmail
    );
    if (!bridgeResult.success) {
      onboardingStripeDebug('apply-checkout', 'onboarding bridge failed', {
        userId: userId.trim(),
        error: bridgeResult.error,
      });
      return { success: false, error: bridgeResult.error };
    }
    onboardingStripeDebug('apply-checkout', 'onboarding bridge ok', {
      userId: userId.trim(),
    });
  }

  onboardingStripeDebug('apply-checkout', 'done', {
    userId: userId.trim(),
    stripeSubscriptionIdSuffix: stripeSubscriptionId?.slice(-8) ?? null,
    subscriptionStatus,
  });

  return { success: true };
}
