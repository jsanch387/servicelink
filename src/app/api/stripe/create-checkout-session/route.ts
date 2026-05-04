/**
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout Session for the Pro plan and returns the session URL.
 * Requires auth. User is redirected to Stripe to complete payment.
 *
 * When `profiles.stripe_customer_id` is set, passes `customer` so Stripe reuses
 * that Customer (avoids duplicate Customers per email). Otherwise uses `customer_email`.
 * See `src/app/api/stripe/README.md` → “One Stripe Customer per profile”.
 *
 * Env: STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID (Stripe Price ID for Pro monthly),
 *      optional NEXT_PUBLIC_SITE_URL for success/cancel URLs.
 */

import { getAppBaseUrl, getStripePlatform } from '@/libs/stripe';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      console.error('STRIPE_PRO_PRICE_ID is not set');
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

    const body = await request.json().catch(() => ({}));
    const fromOnboarding =
      body &&
      typeof body === 'object' &&
      (body as { source?: unknown }).source === 'onboarding_trial_bridge';
    const successPath = fromOnboarding
      ? '/dashboard/business-profile?onboarding=complete'
      : '/dashboard/settings?checkout=success';
    const cancelPath = fromOnboarding ? '/dashboard' : '/dashboard/upgrade';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      ...(fromOnboarding
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
      success_url: `${baseUrl}${successPath}`,
      cancel_url: `${baseUrl}${cancelPath}`,
      ...(existingStripeCustomerId
        ? { customer: existingStripeCustomerId }
        : { customer_email: user.email ?? undefined }),
      metadata: {
        userId: user.id,
        source: fromOnboarding ? 'onboarding_trial_bridge' : 'upgrade',
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { success: false, error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, url: session.url });
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
