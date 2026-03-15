/**
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout Session for the Pro plan and returns the session URL.
 * Requires auth. User is redirected to Stripe to complete payment.
 *
 * Env: STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID (Stripe Price ID for Pro monthly),
 *      optional NEXT_PUBLIC_SITE_URL for success/cancel URLs.
 */

import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(secret);
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (typeof process.env.VERCEL_URL === 'string'
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')
  );
}

export async function POST() {
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

    const baseUrl = getBaseUrl();
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/settings?checkout=success`,
      cancel_url: `${baseUrl}/dashboard/upgrade`,
      customer_email: user.email ?? undefined,
      metadata: {
        userId: user.id,
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
