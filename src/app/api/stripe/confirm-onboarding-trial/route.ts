/**
 * POST /api/stripe/confirm-onboarding-trial
 *
 * Returns authoritative trial + Pro subscription fields for the signed-in user,
 * merging `profiles` with Stripe. After mobile Stripe Checkout returns, call
 * with `checkout_session_id` so the server can apply the same updates as the
 * webhook when Stripe is slightly ahead of the webhook (idempotent).
 *
 * Auth: cookies (web) or `Authorization: Bearer` (mobile).
 */

import {
  applyPlatformProCheckoutSessionCompleted,
  buildTrialConfirmationPayload,
} from '@/features/pricing/server/trialConfirmationPayload';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { getStripePlatform } from '@/libs/stripe';
import { onboardingStripeDebug } from '@/libs/stripe/onboardingStripeDebugLog';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

const LOG = '[stripe:confirm-onboarding-trial]';

type Body = {
  checkout_session_id?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      console.warn(`${LOG} auth failed`, {
        status: auth.status,
        code: auth.code,
      });
      onboardingStripeDebug('confirm-trial', 'auth failed', {
        status: auth.status,
        code: auth.code,
      });
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    const { user, authMethod } = auth;
    const stripe = getStripePlatform();
    const admin = createSupabaseAdminClient();

    const raw = (await request.json().catch(() => ({}))) as Body;
    const checkoutSessionId =
      typeof raw.checkout_session_id === 'string'
        ? raw.checkout_session_id.trim()
        : '';

    onboardingStripeDebug('confirm-trial', 'request', {
      userId: user.id,
      authMethod,
      hasCheckoutSessionId: Boolean(checkoutSessionId),
      checkoutSessionIdSuffix: checkoutSessionId
        ? checkoutSessionId.slice(-8)
        : null,
    });

    let syncedFromCheckout = false;

    if (checkoutSessionId) {
      let session: Awaited<
        ReturnType<typeof stripe.checkout.sessions.retrieve>
      >;
      try {
        session = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
          expand: ['subscription'],
        });
      } catch (e) {
        console.warn(`${LOG} session retrieve failed`, {
          checkoutSessionIdSuffix: checkoutSessionId.slice(-8),
          e,
        });
        onboardingStripeDebug('confirm-trial', 'session retrieve failed', {
          checkoutSessionIdSuffix: checkoutSessionId.slice(-8),
        });
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid or unknown checkout session',
          },
          { status: 400 }
        );
      }

      const metaUserId =
        typeof session.metadata?.userId === 'string'
          ? session.metadata.userId.trim()
          : '';
      if (!metaUserId || metaUserId !== user.id) {
        onboardingStripeDebug(
          'confirm-trial',
          'reject: session user mismatch',
          {
            sessionUserIdSet: Boolean(metaUserId),
          }
        );
        return NextResponse.json(
          { success: false, error: 'Checkout session does not belong to you' },
          { status: 403 }
        );
      }

      if (session.mode !== 'subscription') {
        onboardingStripeDebug('confirm-trial', 'reject: wrong mode', {
          mode: session.mode,
        });
        return NextResponse.json(
          { success: false, error: 'Not a subscription checkout session' },
          { status: 400 }
        );
      }

      const source =
        typeof session.metadata?.source === 'string'
          ? session.metadata.source.trim()
          : '';
      if (source !== 'onboarding_trial_bridge') {
        onboardingStripeDebug(
          'confirm-trial',
          'reject: wrong metadata.source',
          {
            source: source || null,
          }
        );
        return NextResponse.json(
          {
            success: false,
            error: 'This session is not the onboarding trial checkout',
          },
          { status: 400 }
        );
      }

      onboardingStripeDebug('confirm-trial', 'session loaded', {
        checkoutSessionIdSuffix: checkoutSessionId.slice(-8),
        status: session.status,
        payment_status: session.payment_status,
      });

      if (session.status === 'complete') {
        const apply = await applyPlatformProCheckoutSessionCompleted(
          admin,
          stripe,
          session
        );
        if (!apply.success) {
          console.error(`${LOG} apply checkout session failed`, apply.error);
          return NextResponse.json(
            { success: false, error: apply.error ?? 'Sync failed' },
            { status: 500 }
          );
        }
        syncedFromCheckout = true;
        onboardingStripeDebug('confirm-trial', 'applied checkout → profile', {
          userId: user.id,
        });
      } else {
        const trial_confirmation = await buildTrialConfirmationPayload(
          admin,
          stripe,
          user.id
        );
        onboardingStripeDebug('confirm-trial', 'checkout still pending', {
          userId: user.id,
          checkout_session_status: session.status,
        });
        console.info(`${LOG} success (checkout_pending)`);
        return NextResponse.json({
          success: true,
          checkout_pending: true,
          checkout_session_status: session.status,
          synced_from_checkout: false,
          trial_confirmation,
        });
      }
    }

    const trial_confirmation = await buildTrialConfirmationPayload(
      admin,
      stripe,
      user.id
    );

    if (!trial_confirmation) {
      console.warn(`${LOG} profile not found`);
      onboardingStripeDebug('confirm-trial', 'trial_confirmation null', {
        userId: user.id,
      });
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    onboardingStripeDebug('confirm-trial', 'response ready', {
      userId: user.id,
      synced_from_checkout: syncedFromCheckout,
      dbStatus: trial_confirmation.subscription_status,
      stripeStatus: trial_confirmation.stripe.status,
      trialEnd: trial_confirmation.stripe.trial_end,
      onboarding_status: trial_confirmation.onboarding_status,
    });

    console.info(`${LOG} success`);
    return NextResponse.json({
      success: true,
      synced_from_checkout: syncedFromCheckout,
      trial_confirmation,
    });
  } catch (err) {
    console.error(`${LOG} unexpected error`, err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
