/**
 * POST /api/stripe/create-portal-session
 *
 * Creates a Stripe Customer Portal session so the user can manage or cancel
 * their subscription. Requires auth and a stored stripe_customer_id (Pro users).
 *
 * Env: STRIPE_SECRET_KEY, NEXT_PUBLIC_SITE_URL (for return_url).
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

    const baseUrl = getAppBaseUrl(request);
    const stripe = getStripePlatform();

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
