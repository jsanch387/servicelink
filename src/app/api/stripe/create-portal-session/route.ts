/**
 * POST /api/stripe/create-portal-session
 *
 * Creates a Stripe Customer Portal session so the user can manage or cancel
 * their subscription. Requires auth (cookies on web) and a stored
 * `profiles.stripe_customer_id`.
 *
 * Env: STRIPE_SECRET_KEY, NEXT_PUBLIC_SITE_URL (web `return_url`).
 *
 * Mobile (iOS) no longer uses this route — see Stripe README.
 */

import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { getAppBaseUrl, getStripePlatform } from '@/libs/stripe';
import { NextRequest, NextResponse } from 'next/server';

type PortalRequestBody = {
  client?: unknown;
};

const LOG = '[stripe:create-portal-session]';

const MOBILE_BILLING_PORTAL_DISABLED =
  'In-app billing portal is no longer available on mobile. Sign in at myservicelink.app to manage your subscription.';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      console.warn(`${LOG} auth failed`, {
        status: auth.status,
        code: auth.code,
        message: auth.error,
      });
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    const { user, supabase } = auth;

    const body = (await request.json().catch(() => ({}))) as PortalRequestBody;

    if (body.client === 'mobile') {
      console.warn(`${LOG} rejected mobile billing portal`);
      return NextResponse.json(
        { success: false, error: MOBILE_BILLING_PORTAL_DISABLED },
        { status: 410 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const stripeCustomerId = (
      profile as { stripe_customer_id?: string | null } | null
    )?.stripe_customer_id;

    if (!stripeCustomerId?.trim()) {
      console.warn(`${LOG} no stripe_customer_id`);
      return NextResponse.json(
        { success: false, error: 'No billing account found' },
        { status: 400 }
      );
    }

    const baseUrl = getAppBaseUrl(request);
    const stripe = getStripePlatform();
    const returnUrl = `${baseUrl}/dashboard/settings`;

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId.trim(),
      return_url: returnUrl,
    });

    if (!session.url) {
      console.error(`${LOG} Stripe returned no session.url`);
      return NextResponse.json(
        { success: false, error: 'Failed to create portal session' },
        { status: 500 }
      );
    }

    console.info(`${LOG} portal session created`);

    return NextResponse.json({ success: true, url: session.url });
  } catch (err) {
    console.error(`${LOG} Stripe portal session error`, err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
