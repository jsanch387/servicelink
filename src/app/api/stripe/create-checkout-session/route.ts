/**
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout Session for the Pro plan and returns the session URL.
 * Requires auth (Supabase cookies on web, or `Authorization: Bearer <access_token>`
 * from the Expo app). User opens `url` in an in-app browser to complete payment.
 *
 * When `profiles.stripe_customer_id` is set, passes `customer` so Stripe reuses
 * that Customer (avoids duplicate Customers per email). Otherwise uses `customer_email`.
 * See `src/app/api/stripe/README.md` → “One Stripe Customer per profile”.
 *
 * Env: STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID (Stripe Price ID for Pro monthly),
 *      optional NEXT_PUBLIC_SITE_URL for success/cancel URLs (web).
 *      For mobile onboarding trial: STRIPE_MOBILE_ONBOARDING_SUCCESS_URL,
 *      STRIPE_MOBILE_ONBOARDING_CANCEL_URL.
 *      For mobile paywall upgrade (no onboarding source): STRIPE_MOBILE_UPGRADE_SUCCESS_URL,
 *      STRIPE_MOBILE_UPGRADE_CANCEL_URL.
 */

import { API_ROUTES } from '@/constants/routes';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { onboardingStripeDebug } from '@/libs/stripe/onboardingStripeDebugLog';
import { getAppBaseUrl, getStripePlatform } from '@/libs/stripe';
import { NextRequest, NextResponse } from 'next/server';

type CheckoutRequestBody = {
  source?: unknown;
  /** When `mobile` with `source: onboarding_trial_bridge`, success/cancel use env deep links. */
  client?: unknown;
};

const LOG = '[stripe:create-checkout-session]';

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

    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      console.error(`${LOG} STRIPE_PRO_PRICE_ID is not set`);
      return NextResponse.json(
        { success: false, error: 'Checkout is not configured' },
        { status: 500 }
      );
    }

    const baseUrl = getAppBaseUrl(request);
    const stripe = getStripePlatform();

    // Reuse the Stripe Customer already tied to this profile so Checkout does not
    // create a second Customer with the same email (orphan rows + confusing renewals).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileRow } = await (supabase as any)
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const existingStripeCustomerId =
      typeof profileRow?.stripe_customer_id === 'string'
        ? profileRow.stripe_customer_id.trim()
        : '';

    const body = (await request
      .json()
      .catch(() => ({}))) as CheckoutRequestBody;
    const fromOnboarding =
      body &&
      typeof body === 'object' &&
      body.source === 'onboarding_trial_bridge';
    const isMobileClient = body.client === 'mobile';
    /** 7-day trial only for first Stripe customer; returning `cus_…` skips trial (same as paywall upgrade). */
    const applyOnboardingTrial = fromOnboarding && !existingStripeCustomerId;

    onboardingStripeDebug('create-checkout', 'request', {
      userId: user.id,
      authMethod,
      fromOnboarding,
      isMobileClient,
      applyOnboardingTrial,
      existingStripeCustomerIdSuffix: existingStripeCustomerId
        ? existingStripeCustomerId.slice(-8)
        : null,
    });

    let successUrl: string;
    let cancelUrl: string;

    if (isMobileClient) {
      if (fromOnboarding) {
        const mobileSuccess =
          process.env.STRIPE_MOBILE_ONBOARDING_SUCCESS_URL?.trim();
        const mobileCancel =
          process.env.STRIPE_MOBILE_ONBOARDING_CANCEL_URL?.trim();
        if (!mobileSuccess || !mobileCancel) {
          console.error(`${LOG} mobile onboarding return URLs missing`, {
            STRIPE_MOBILE_ONBOARDING_SUCCESS_URL: Boolean(mobileSuccess)
              ? '(set)'
              : '(missing)',
            STRIPE_MOBILE_ONBOARDING_CANCEL_URL: Boolean(mobileCancel)
              ? '(set)'
              : '(missing)',
            hint: 'Add both to .env.local and restart next dev',
          });
          return NextResponse.json(
            {
              success: false,
              error:
                'Mobile onboarding checkout is not configured. Set STRIPE_MOBILE_ONBOARDING_SUCCESS_URL and STRIPE_MOBILE_ONBOARDING_CANCEL_URL.',
            },
            { status: 500 }
          );
        }
        successUrl = mobileSuccess;
        cancelUrl = mobileCancel;
      } else {
        const upgradeSuccess =
          process.env.STRIPE_MOBILE_UPGRADE_SUCCESS_URL?.trim();
        const upgradeCancel =
          process.env.STRIPE_MOBILE_UPGRADE_CANCEL_URL?.trim();
        if (!upgradeSuccess || !upgradeCancel) {
          console.error(`${LOG} mobile upgrade return URLs missing`, {
            STRIPE_MOBILE_UPGRADE_SUCCESS_URL: Boolean(upgradeSuccess)
              ? '(set)'
              : '(missing)',
            STRIPE_MOBILE_UPGRADE_CANCEL_URL: Boolean(upgradeCancel)
              ? '(set)'
              : '(missing)',
            hint: 'Add both to .env.local and restart next dev',
          });
          return NextResponse.json(
            {
              success: false,
              error:
                'Mobile upgrade checkout is not configured. Set STRIPE_MOBILE_UPGRADE_SUCCESS_URL and STRIPE_MOBILE_UPGRADE_CANCEL_URL.',
            },
            { status: 500 }
          );
        }
        successUrl = upgradeSuccess;
        cancelUrl = upgradeCancel;
      }
    } else {
      const successPath = fromOnboarding
        ? '/dashboard/business-profile?onboarding=complete'
        : '/dashboard/settings?checkout=success';
      const cancelPath = fromOnboarding ? '/dashboard' : '/dashboard/upgrade';
      successUrl = `${baseUrl}${successPath}`;
      cancelUrl = `${baseUrl}${cancelPath}`;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      ...(applyOnboardingTrial
        ? {
            payment_method_collection: 'if_required',
            subscription_data: {
              trial_period_days: 7,
              trial_settings: {
                end_behavior: {
                  missing_payment_method: 'cancel',
                },
              },
            },
          }
        : {}),
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...(existingStripeCustomerId
        ? { customer: existingStripeCustomerId }
        : { customer_email: user.email ?? undefined }),
      metadata: {
        userId: user.id,
        source: fromOnboarding ? 'onboarding_trial_bridge' : 'upgrade',
        ...(isMobileClient ? { client: 'mobile' } : {}),
      },
    });

    if (!session.url) {
      console.error(`${LOG} Stripe returned no session.url`);
      return NextResponse.json(
        { success: false, error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    console.info(`${LOG} checkout session created`);

    onboardingStripeDebug('create-checkout', 'session created', {
      userId: user.id,
      sessionIdSuffix: session.id.slice(-8),
      fromOnboarding,
      isMobileClient,
      applyOnboardingTrial,
    });

    if (fromOnboarding && isMobileClient) {
      return NextResponse.json({
        success: true,
        url: session.url,
        trial_checkout_followup: {
          confirm_session: {
            method: 'POST' as const,
            path: API_ROUTES.STRIPE_CONFIRM_ONBOARDING_TRIAL,
            /** Pass the completed Checkout Session id (e.g. from `session_id` on your success URL). */
            body_json_shape: { checkout_session_id: 'string' },
          },
        },
      });
    }

    return NextResponse.json({ success: true, url: session.url });
  } catch (err) {
    console.error(`${LOG} Stripe checkout session error`, err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
