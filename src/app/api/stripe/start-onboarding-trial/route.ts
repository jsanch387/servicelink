/**
 * POST /api/stripe/start-onboarding-trial
 *
 * Onboarding step 5: creates a Stripe Subscription with a 7-day trial without
 * Stripe Checkout when eligible. Response includes `trial_confirmation` (DB +
 * Stripe trial fields) for mobile and web.
 *
 * Auth: Supabase cookies (web) or `Authorization: Bearer` (mobile / same as checkout).
 *
 * Env: STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID
 */

import { runOnboardingTrialBridgeAfterSubscribe } from '@/features/onboarding-v2/server/onboardingTrialBridgeAfterSubscribe';
import { retrieveSubscriptionCurrentPeriodEndIso } from '@/features/pricing/server/stripeSubscriptionPeriodEnd';
import { buildTrialConfirmationPayload } from '@/features/pricing/server/trialConfirmationPayload';
import { updateProfileFromCheckout } from '@/features/pricing/server/updateProfileFromCheckout';
import { STRIPE_SUBSCRIPTION_STATUSES_GRANTING_PRO } from '@/features/pricing/utils/isProAccess';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { getStripePlatform } from '@/libs/stripe';
import { onboardingStripeDebug } from '@/libs/stripe/onboardingStripeDebugLog';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const LOG = '[stripe:start-onboarding-trial]';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      console.warn(`${LOG} auth failed`, {
        status: auth.status,
        code: auth.code,
      });
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    const { user, supabase, authMethod } = auth;

    onboardingStripeDebug('start-trial', 'request', {
      userId: user.id,
      authMethod,
    });

    const priceId = process.env.STRIPE_PRO_PRICE_ID?.trim();
    if (!priceId) {
      console.error(`${LOG} STRIPE_PRO_PRICE_ID is not set`);
      return NextResponse.json(
        { success: false, error: 'Billing is not configured' },
        { status: 500 }
      );
    }

    const stripe = getStripePlatform();

    const { data: profileRow, error: profileReadError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('profiles')
        .select(
          'stripe_customer_id, stripe_subscription_id, subscription_tier, subscription_status, subscription_current_period_end'
        )
        .eq('user_id', user.id)
        .single();

    if (profileReadError || !profileRow) {
      console.warn(`${LOG} profile not found`);
      onboardingStripeDebug('start-trial', 'profile read failed', {
        userId: user.id,
        error: profileReadError?.message,
      });
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    onboardingStripeDebug('start-trial', 'profile snapshot', {
      userId: user.id,
      hasStripeCustomer: Boolean(
        typeof profileRow.stripe_customer_id === 'string' &&
          profileRow.stripe_customer_id.trim()
      ),
      stripeSubscriptionIdSuffix:
        typeof profileRow.stripe_subscription_id === 'string'
          ? profileRow.stripe_subscription_id.trim().slice(-8)
          : null,
      subscription_status: profileRow.subscription_status ?? null,
      subscription_tier: profileRow.subscription_tier ?? null,
    });

    const stripeSubId =
      typeof profileRow.stripe_subscription_id === 'string'
        ? profileRow.stripe_subscription_id.trim()
        : '';
    const subStatus =
      typeof profileRow.subscription_status === 'string'
        ? profileRow.subscription_status.trim()
        : '';

    if (
      stripeSubId &&
      subStatus &&
      STRIPE_SUBSCRIPTION_STATUSES_GRANTING_PRO.has(subStatus)
    ) {
      const bridge = await runOnboardingTrialBridgeAfterSubscribe(
        supabase,
        user.id,
        user.email
      );
      if (!bridge.success) {
        console.error(`${LOG} onboarding bridge failed`, bridge.error);
        return NextResponse.json(
          { success: false, error: bridge.error ?? 'Onboarding update failed' },
          { status: 500 }
        );
      }
      const trial_confirmation = await buildTrialConfirmationPayload(
        supabase,
        stripe,
        user.id
      );
      onboardingStripeDebug(
        'start-trial',
        'branch: already active / trialing',
        {
          userId: user.id,
          stripeStatus: trial_confirmation?.stripe.status ?? null,
          trialEnd: trial_confirmation?.stripe.trial_end ?? null,
          onboarding_status: trial_confirmation?.onboarding_status ?? null,
        }
      );
      revalidatePath('/dashboard', 'layout');
      console.info(`${LOG} success (already_active)`);
      return NextResponse.json({
        success: true,
        alreadyActive: true,
        ...(trial_confirmation ? { trial_confirmation } : {}),
      });
    }

    const hadStripeCustomerAtEntry = Boolean(
      typeof profileRow.stripe_customer_id === 'string' &&
        profileRow.stripe_customer_id.trim()
    );

    let stripeCustomerId = hadStripeCustomerAtEntry
      ? String(profileRow.stripe_customer_id).trim()
      : '';

    if (!stripeCustomerId) {
      onboardingStripeDebug('start-trial', 'creating Stripe customer', {
        userId: user.id,
      });
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: customerPersistError } = await (supabase as any)
        .from('profiles')
        .update({
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      if (customerPersistError) {
        console.error(
          `${LOG} failed to persist stripe_customer_id`,
          customerPersistError
        );
        return NextResponse.json(
          { success: false, error: 'Could not save billing profile' },
          { status: 500 }
        );
      }
    }

    const applyOnboardingTrial = !hadStripeCustomerAtEntry;

    onboardingStripeDebug('start-trial', 'subscription.create prep', {
      userId: user.id,
      stripeCustomerIdSuffix: stripeCustomerId.slice(-8),
      applyOnboardingTrial,
      priceIdSuffix: priceId.slice(-12),
    });

    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: stripeCustomerId,
      items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId: user.id,
        source: 'onboarding_trial_silent',
      },
    };

    if (applyOnboardingTrial) {
      subscriptionParams.trial_period_days = 7;
      subscriptionParams.trial_settings = {
        end_behavior: {
          missing_payment_method: 'cancel',
        },
      };
    }

    let subscription: Stripe.Subscription;
    try {
      subscription = await stripe.subscriptions.create(subscriptionParams, {
        idempotencyKey: `onboarding-trial-silent:${user.id}`,
      });
    } catch (stripeErr: unknown) {
      console.error(`${LOG} subscriptions.create failed`, stripeErr);
      onboardingStripeDebug(
        'start-trial',
        'subscriptions.create error detail',
        {
          userId: user.id,
          applyOnboardingTrial,
          stripeErrType:
            stripeErr instanceof Error ? stripeErr.name : typeof stripeErr,
          stripeErrMessage:
            stripeErr instanceof Error ? stripeErr.message : String(stripeErr),
        }
      );
      const fallbackToCheckout =
        !applyOnboardingTrial ||
        stripeErr instanceof Stripe.errors.StripeInvalidRequestError;
      return NextResponse.json(
        {
          success: false,
          error:
            "We couldn't turn on your link just now. Please try again in a moment.",
          fallbackToCheckout,
        },
        { status: 409 }
      );
    }

    const normalizedStatus = (subscription.status ?? '').trim();
    if (!STRIPE_SUBSCRIPTION_STATUSES_GRANTING_PRO.has(normalizedStatus)) {
      console.error(`${LOG} subscription created with unexpected status`, {
        subscriptionIdSuffix: subscription.id.slice(-8),
        status: normalizedStatus,
      });
      return NextResponse.json(
        {
          success: false,
          error:
            "We couldn't turn on your link just now. Please try again in a moment.",
          fallbackToCheckout: true,
        },
        { status: 409 }
      );
    }

    const currentPeriodEnd = await retrieveSubscriptionCurrentPeriodEndIso(
      stripe,
      subscription.id
    );
    const subscriptionStatus = normalizedStatus;

    const profileUpdate = await updateProfileFromCheckout(supabase, {
      userId: user.id,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd,
      subscriptionStatus,
    });
    if (!profileUpdate.success) {
      console.error(
        `${LOG} updateProfileFromCheckout failed`,
        profileUpdate.error
      );
      return NextResponse.json(
        {
          success: false,
          error: profileUpdate.error ?? 'Profile update failed',
        },
        { status: 500 }
      );
    }

    const bridge = await runOnboardingTrialBridgeAfterSubscribe(
      supabase,
      user.id,
      user.email
    );
    if (!bridge.success) {
      console.error(`${LOG} onboarding bridge failed`, bridge.error);
      return NextResponse.json(
        {
          success: false,
          error: bridge.error ?? 'Onboarding completion failed',
        },
        { status: 500 }
      );
    }

    const trial_confirmation = await buildTrialConfirmationPayload(
      supabase,
      stripe,
      user.id
    );

    onboardingStripeDebug('start-trial', 'success: new silent subscription', {
      userId: user.id,
      subscriptionIdSuffix: subscription.id.slice(-8),
      subscriptionStatus: subscription.status,
      dbSubscriptionStatus: trial_confirmation?.subscription_status ?? null,
      trialEnd: trial_confirmation?.stripe.trial_end ?? null,
      periodEnd: trial_confirmation?.subscription_current_period_end ?? null,
    });

    console.info(`${LOG} success`);
    revalidatePath('/dashboard', 'layout');
    return NextResponse.json({
      success: true,
      ...(trial_confirmation ? { trial_confirmation } : {}),
    });
  } catch (err) {
    console.error(`${LOG} unexpected error`, err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
