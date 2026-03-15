/**
 * POST /api/stripe/create-portal-session
 *
 * Creates a Stripe Customer Portal session so the user can manage or cancel
 * their subscription. Requires auth and a stored stripe_customer_id (Pro users).
 *
 * Env: STRIPE_SECRET_KEY, NEXT_PUBLIC_SITE_URL (for return_url).
 */

import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(secret);
}

function getBaseUrl(request: NextRequest): string {
  const host =
    request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto =
    request.headers.get('x-forwarded-proto') ||
    (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  if (host) {
    return `${proto}://${host}`;
  }
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (typeof process.env.VERCEL_URL === 'string'
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')
  );
}

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const stripeCustomerId = (
      profile as { stripe_customer_id?: string | null } | null
    )?.stripe_customer_id;

    if (!stripeCustomerId?.trim()) {
      return NextResponse.json(
        { success: false, error: 'No billing account found' },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl(request);
    const stripe = getStripe();

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId.trim(),
      return_url: `${baseUrl}/dashboard/settings`,
    });

    if (!session.url) {
      return NextResponse.json(
        { success: false, error: 'Failed to create portal session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, url: session.url });
  } catch (err) {
    console.error('Stripe portal session error:', err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
