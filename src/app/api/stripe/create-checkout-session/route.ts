/**
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout Session for the Pro plan and returns the session URL.
 * Requires auth (Supabase cookies on web, or `Authorization: Bearer <access_token>`
 * from the Expo app for Connect-only flows — not mobile subscription checkout).
 * User opens `url` in browser to complete payment.
 *
 * When `profiles.stripe_subscription_id` points at a subscription that still
 * exists in Stripe (`past_due`, `unpaid`, `incomplete`, `paused`, or `active`/`trialing`
 * with an open invoice), Checkout is created in **payment** mode for that invoice
 * so the same subscription is paid (e.g. new card or Link) instead of starting a second subscription.
 *
 * Env: STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID (Stripe Price ID for Pro monthly),
 *      optional NEXT_PUBLIC_SITE_URL for success/cancel URLs (web).
 *
 * Mobile (iOS) no longer uses this route for subscription checkout — see Stripe README.
 */

import {
  findOpenInvoiceIdForSubscriptionResume,
  isSubscriptionResumableViaInvoice,
} from '@/features/pricing/server/findOpenInvoiceForSubscriptionResume';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { getAppBaseUrl, getStripePlatform } from '@/libs/stripe';
import { buildStripeCheckoutAutomaticTaxParams } from '@/libs/stripe/checkoutAutomaticTax';
import { buildProSubscriptionCheckoutLineItem } from '@/libs/stripe/proSubscriptionLineItem';
import { onboardingStripeDebug } from '@/libs/stripe/onboardingStripeDebugLog';
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

type CheckoutRequestBody = {
  source?: unknown;
  client?: unknown;
};

const LOG = '[stripe:create-checkout-session]';

const MOBILE_SUBSCRIPTION_CHECKOUT_DISABLED =
  'In-app subscription checkout is no longer available on mobile. Sign in at myservicelink.app to manage your plan.';

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

    const body = (await request
      .json()
      .catch(() => ({}))) as CheckoutRequestBody;

    if (body.client === 'mobile') {
      console.warn(`${LOG} rejected mobile subscription checkout`);
      return NextResponse.json(
        { success: false, error: MOBILE_SUBSCRIPTION_CHECKOUT_DISABLED },
        { status: 410 }
      );
    }

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

    const fromOnboarding =
      body &&
      typeof body === 'object' &&
      body.source === 'onboarding_trial_bridge';
    /** 7-day trial only for first Stripe customer; returning `cus_…` skips trial (same as paywall upgrade). */
    const applyOnboardingTrial = fromOnboarding && !existingStripeCustomerId;

    onboardingStripeDebug('create-checkout', 'request', {
      userId: user.id,
      authMethod,
      fromOnboarding,
      applyOnboardingTrial,
      existingStripeCustomerIdSuffix: existingStripeCustomerId
        ? existingStripeCustomerId.slice(-8)
        : null,
    });

    const successPath = fromOnboarding
      ? '/dashboard/business-profile?onboarding=complete'
      : '/dashboard/settings?checkout=success';
    const cancelPath = fromOnboarding ? '/dashboard' : '/dashboard/upgrade';
    const successUrl = `${baseUrl}${successPath}`;
    const cancelUrl = `${baseUrl}${cancelPath}`;

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
            ...buildStripeCheckoutAutomaticTaxParams({
              hasExistingCustomer: Boolean(existingStripeCustomerId),
            }),
            ...(existingStripeCustomerId
              ? { customer: existingStripeCustomerId }
              : { customer_email: user.email ?? undefined }),
            metadata: {
              userId: user.id,
              source: fromOnboarding ? 'onboarding_trial_bridge' : 'upgrade',
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

          return NextResponse.json({ success: true, url: resumeSession.url });
        }
      } catch (resumeErr) {
        console.warn(
          `${LOG} existing subscription resume skipped; creating new checkout`,
          resumeErr
        );
      }
    }

    const proLineItem = await buildProSubscriptionCheckoutLineItem(
      stripe,
      priceId
    );

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [proLineItem],
      ...buildStripeCheckoutAutomaticTaxParams({
        hasExistingCustomer: Boolean(existingStripeCustomerId),
      }),
      ...(applyOnboardingTrial
        ? {
            payment_method_collection: 'if_required' as const,
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
      applyOnboardingTrial,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (err) {
    console.error(`${LOG} Stripe checkout session error`, err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
