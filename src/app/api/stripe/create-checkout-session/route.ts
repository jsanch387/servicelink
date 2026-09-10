/**
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout Session for the Pro plan and returns the session URL.
 * Requires auth (Supabase cookies on web, or `Authorization: Bearer <access_token>`
 * from the Expo app for Connect-only flows — not mobile subscription checkout).
 * User opens `url` in browser to complete payment.
 *
 * One open Pro subscription per Stripe customer: if this customer still has a
 * non-canceled sub (`past_due` included), we resume that invoice or block —
 * we never start a second subscription. New Checkout is only for first paid
 * or a true cancel → resubscribe.
 *
 * Env: STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID (Stripe Price ID for Pro monthly),
 *      STRIPE_PRO_YEARLY_PRICE_ID (optional yearly $200/yr price),
 *      optional NEXT_PUBLIC_SITE_URL for success/cancel URLs (web).
 *
 * Mobile (iOS) no longer uses this route for subscription checkout — see Stripe README.
 */

import {
  resolveAffonsoReferral,
  withAffonsoCheckoutMetadata,
} from '@/features/marketing-attribution/server/affonsoCheckoutMetadata';
import { findOpenInvoiceIdForSubscriptionResume } from '@/features/pricing/server/findOpenInvoiceForSubscriptionResume';
import {
  cancelExtraPlatformProSubscriptions,
  decideProCheckoutAction,
  listOpenPlatformSubscriptions,
} from '@/features/pricing/server/openPlatformSubscriptions';
import type { BillingInterval } from '@/features/pricing/types';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { getAppBaseUrl, getStripePlatform } from '@/libs/stripe';
import { buildStripeCheckoutAutomaticTaxParams } from '@/libs/stripe/checkoutAutomaticTax';
import { buildProSubscriptionCheckoutLineItem } from '@/libs/stripe/proSubscriptionLineItem';
import { onboardingStripeDebug } from '@/libs/stripe/onboardingStripeDebugLog';
import { resolveStripeProPriceId } from '@/libs/stripe/resolveStripeProPriceId';
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

type CheckoutRequestBody = {
  client?: unknown;
  billingInterval?: unknown;
  affonsoReferral?: unknown;
};

function parseBillingInterval(value: unknown): BillingInterval {
  return value === 'year' ? 'year' : 'month';
}

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

    const affonsoReferral = resolveAffonsoReferral(
      request,
      body.affonsoReferral
    );
    const billingInterval = parseBillingInterval(body.billingInterval);
    const priceId = resolveStripeProPriceId(billingInterval);
    if (!priceId) {
      const envKey =
        billingInterval === 'year'
          ? 'STRIPE_PRO_YEARLY_PRICE_ID'
          : 'STRIPE_PRO_PRICE_ID';
      console.error(`${LOG} ${envKey} is not set`);
      return NextResponse.json(
        {
          success: false,
          error:
            billingInterval === 'year'
              ? 'Yearly checkout is not configured yet'
              : 'Checkout is not configured',
        },
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

    onboardingStripeDebug('create-checkout', 'request', {
      userId: user.id,
      authMethod,
      billingInterval,
      existingStripeCustomerIdSuffix: existingStripeCustomerId
        ? existingStripeCustomerId.slice(-8)
        : null,
    });

    const successUrl = `${baseUrl}/dashboard/settings?checkout=success`;
    const cancelUrl = `${baseUrl}/dashboard/upgrade`;

    if (existingStripeCustomerId) {
      let openSubs: Stripe.Subscription[];
      try {
        openSubs = await listOpenPlatformSubscriptions(
          stripe,
          existingStripeCustomerId
        );
      } catch (listErr) {
        console.error(`${LOG} list open subscriptions failed`, listErr);
        return NextResponse.json(
          { success: false, error: 'Something went wrong' },
          { status: 500 }
        );
      }

      const decision = decideProCheckoutAction(
        openSubs,
        existingStripeSubscriptionId
      );

      if (decision.action !== 'new_subscription' && decision.extraIds.length) {
        const keeperId =
          decision.action === 'block_healthy'
            ? decision.keeperId
            : decision.subscriptionId;
        if (keeperId !== existingStripeSubscriptionId) {
          // Point the profile at the keeper before canceling extras so
          // subscription.deleted on the leftover does not wipe a live sub.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('profiles')
            .update({
              stripe_subscription_id: keeperId,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
        }
        const canceledIds = await cancelExtraPlatformProSubscriptions(
          stripe,
          decision.extraIds
        );
        if (canceledIds.length) {
          console.warn(`${LOG} canceled extra platform Pro subscriptions`, {
            userId: user.id,
            keeperIdSuffix: keeperId.slice(-8),
            canceledSuffixes: canceledIds.map(id => id.slice(-8)),
          });
        }
      }

      if (decision.action === 'block_healthy') {
        console.warn(
          `${LOG} blocked — this customer already has a live Pro sub`,
          {
            userId: user.id,
            customerId: existingStripeCustomerId.slice(-8),
            keeperIdSuffix: decision.keeperId.slice(-8),
          }
        );
        onboardingStripeDebug(
          'create-checkout',
          'blocked: open healthy subscription exists',
          {
            userId: user.id,
            keeperIdSuffix: decision.keeperId.slice(-8),
          }
        );
        return NextResponse.json(
          {
            success: false,
            error:
              'You already have an active subscription. To change your plan, please cancel your current subscription in Settings first, or contact support for assistance.',
            code: 'DUPLICATE_SUBSCRIPTION_BLOCKED',
          },
          { status: 400 }
        );
      }

      if (decision.action === 'resume') {
        try {
          const openInv = await findOpenInvoiceIdForSubscriptionResume(
            stripe,
            decision.subscriptionId
          );
          if (!openInv) {
            return NextResponse.json(
              {
                success: false,
                error:
                  'We could not start a payment for your current subscription. Open Billing in Settings to update your payment method.',
                code: 'PAYMENT_RETRY_REQUIRED',
              },
              { status: 409 }
            );
          }

          const resumeSession = await stripe.checkout.sessions.create({
            mode: 'payment',
            invoice: openInv,
            success_url: successUrl,
            cancel_url: cancelUrl,
            ...buildStripeCheckoutAutomaticTaxParams({
              hasExistingCustomer: true,
            }),
            customer: existingStripeCustomerId,
            metadata: withAffonsoCheckoutMetadata(
              {
                userId: user.id,
                source: 'upgrade',
              },
              affonsoReferral
            ),
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
            `${LOG} checkout session created (invoice resume, same subscription)`,
            { hasAffonsoReferral: Boolean(affonsoReferral) }
          );
          onboardingStripeDebug(
            'create-checkout',
            'session created (invoice resume)',
            {
              userId: user.id,
              sessionIdSuffix: resumeSession.id.slice(-8),
              subscriptionIdSuffix: decision.subscriptionId.slice(-8),
              invoiceIdSuffix: openInv.slice(-8),
              hasAffonsoReferral: Boolean(affonsoReferral),
            }
          );

          return NextResponse.json({ success: true, url: resumeSession.url });
        } catch (resumeErr) {
          console.warn(
            `${LOG} invoice resume failed; not creating a new subscription`,
            resumeErr
          );
          return NextResponse.json(
            {
              success: false,
              error:
                'We could not start a payment for your current subscription. Open Billing in Settings to update your payment method.',
              code: 'PAYMENT_RETRY_REQUIRED',
            },
            { status: 409 }
          );
        }
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
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...(existingStripeCustomerId
        ? { customer: existingStripeCustomerId }
        : { customer_email: user.email ?? undefined }),
      metadata: withAffonsoCheckoutMetadata(
        {
          userId: user.id,
          source: 'upgrade',
          billingInterval,
        },
        affonsoReferral
      ),
      ...(affonsoReferral
        ? {
            subscription_data: {
              metadata: { affonso_referral: affonsoReferral },
            },
          }
        : {}),
    });

    if (!session.url) {
      console.error(`${LOG} Stripe returned no session.url`);
      return NextResponse.json(
        { success: false, error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    console.info(`${LOG} checkout session created`, {
      hasAffonsoReferral: Boolean(affonsoReferral),
    });

    onboardingStripeDebug('create-checkout', 'session created', {
      userId: user.id,
      sessionIdSuffix: session.id.slice(-8),
      billingInterval,
      hasAffonsoReferral: Boolean(affonsoReferral),
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
