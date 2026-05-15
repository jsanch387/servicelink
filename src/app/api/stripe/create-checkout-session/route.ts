/**
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout Session for the Pro plan and returns the session URL.
 * Requires auth (Supabase cookies on web, or `Authorization: Bearer <access_token>`
 * from the Expo app). User opens `url` in an in-app browser to complete payment.
 *
 * When `profiles.stripe_subscription_id` points at a subscription that still
 * exists in Stripe (`past_due`, `unpaid`, `incomplete`, `paused`, or `active`/`trialing`
 * with an open invoice), Checkout is created in **payment** mode for that invoice
 * so the same subscription is paid (e.g. new card or Link) instead of starting a second subscription.
 *
 * Env: STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID (Stripe Price ID for Pro monthly),
 *      optional NEXT_PUBLIC_SITE_URL for success/cancel URLs (web).
 *      Mobile Checkout return URLs: `src/libs/stripe/mobileSubscriptionCheckoutRedirects.ts`.
 */

import { API_ROUTES } from '@/constants/routes';
import {
  findOpenInvoiceIdForSubscriptionResume,
  isSubscriptionResumableViaInvoice,
} from '@/features/pricing/server/findOpenInvoiceForSubscriptionResume';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { getAppBaseUrl, getStripePlatform } from '@/libs/stripe';
import {
  MOBILE_ONBOARDING_CHECKOUT_CANCEL_URL,
  MOBILE_ONBOARDING_CHECKOUT_SUCCESS_URL,
  MOBILE_UPGRADE_CHECKOUT_CANCEL_URL,
  MOBILE_UPGRADE_CHECKOUT_SUCCESS_URL,
} from '@/libs/stripe/mobileSubscriptionCheckoutRedirects';
import { onboardingStripeDebug } from '@/libs/stripe/onboardingStripeDebugLog';
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

type CheckoutRequestBody = {
  source?: unknown;
  /** When `mobile`, success/cancel use fixed Expo deep links (see `mobileSubscriptionCheckoutRedirects`). */
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
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const existingStripeCustomerId =
      typeof profileRow?.stripe_customer_id === 'string'
        ? profileRow.stripe_customer_id.trim()
        : '';
    const existingStripeSubscriptionId =
      typeof profileRow?.stripe_subscription_id === 'string'
        ? profileRow.stripe_subscription_id.trim()
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
        successUrl = MOBILE_ONBOARDING_CHECKOUT_SUCCESS_URL;
        cancelUrl = MOBILE_ONBOARDING_CHECKOUT_CANCEL_URL;
      } else {
        successUrl = MOBILE_UPGRADE_CHECKOUT_SUCCESS_URL;
        cancelUrl = MOBILE_UPGRADE_CHECKOUT_CANCEL_URL;
      }
    } else {
      const successPath = fromOnboarding
        ? '/dashboard/business-profile?onboarding=complete'
        : '/dashboard/settings?checkout=success';
      const cancelPath = fromOnboarding ? '/dashboard' : '/dashboard/upgrade';
      successUrl = `${baseUrl}${successPath}`;
      cancelUrl = `${baseUrl}${cancelPath}`;
    }

    /** Prefer paying an open invoice on the existing subscription (card failed, Link retry, etc.). */
    if (existingStripeSubscriptionId) {
      try {
        const existingSub = await stripe.subscriptions.retrieve(
          existingStripeSubscriptionId
        );
        const status = (existingSub.status ?? '').trim();
        const useInvoiceResume =
          status === 'active' ||
          status === 'trialing' ||
          isSubscriptionResumableViaInvoice(status);

        if (useInvoiceResume) {
          const openInv = await findOpenInvoiceIdForSubscriptionResume(
            stripe,
            existingStripeSubscriptionId
          );
          if (!openInv) {
            const isHealthy = status === 'active' || status === 'trialing';
            return NextResponse.json(
              {
                success: false,
                error: isHealthy
                  ? 'You already have an active subscription. Manage billing in Settings.'
                  : 'We could not start a payment for your current subscription. Open Billing in Settings to update your payment method.',
              },
              { status: isHealthy ? 400 : 409 }
            );
          }

          /** `invoice` on Checkout is valid in the Stripe API; SDK types may lag. */
          const resumeSession = await stripe.checkout.sessions.create({
            mode: 'payment',
            invoice: openInv,
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
          } as unknown as Stripe.Checkout.SessionCreateParams);

          if (!resumeSession.url) {
            console.error(
              `${LOG} Stripe returned no session.url (invoice resume)`
            );
            return NextResponse.json(
              { success: false, error: 'Failed to create checkout session' },
              { status: 500 }
            );
          }

          console.info(
            `${LOG} checkout session created (invoice resume, same subscription)`
          );
          onboardingStripeDebug(
            'create-checkout',

            'session created (invoice resume)',
            {
              userId: user.id,
              sessionIdSuffix: resumeSession.id.slice(-8),
              subscriptionIdSuffix: existingStripeSubscriptionId.slice(-8),
              invoiceIdSuffix: openInv.slice(-8),
              subscriptionStatus: status,
            }
          );

          if (fromOnboarding && isMobileClient) {
            return NextResponse.json({
              success: true,
              url: resumeSession.url,
              trial_checkout_followup: {
                confirm_session: {
                  method: 'POST' as const,
                  path: API_ROUTES.STRIPE_CONFIRM_ONBOARDING_TRIAL,
                  body_json_shape: { checkout_session_id: 'string' },
                },
              },
            });
          }
          return NextResponse.json({ success: true, url: resumeSession.url });
        }
      } catch (resumeErr) {
        console.warn(
          `${LOG} existing subscription resume skipped; creating new checkout`,
          resumeErr
        );
      }
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
