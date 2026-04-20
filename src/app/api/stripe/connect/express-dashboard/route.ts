/**
 * POST /api/stripe/connect/express-dashboard
 *
 * Returns a short-lived Stripe **Express Dashboard** URL for the current
 * business’s connected account (`acct_…`). The owner must be signed in, on
 * Pro, and linked to that account via `payment_accounts`.
 */

import { getHasProAccessForPayments } from '@/features/payments/server/getHasProAccessForPayments';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { getStripePlatform } from '@/libs/stripe/platformClient';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe is not configured (missing STRIPE_SECRET_KEY).',
        },
        { status: 500 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const hasPro = await getHasProAccessForPayments(supabase, user.id);
    if (!hasPro) {
      return NextResponse.json(
        { success: false, error: 'Pro subscription required' },
        { status: 403 }
      );
    }

    const businessResolved = await resolveCurrentBusinessId(supabase);
    if (!businessResolved.ok) {
      return NextResponse.json(
        { success: false, error: businessResolved.error },
        { status: businessResolved.status }
      );
    }

    const businessId = businessResolved.businessId;

    const { data: row, error: rowError } = await paymentAccountsOf(supabase)
      .select('stripe_account_id')
      .eq('business_id', businessId)
      .maybeSingle();

    if (rowError) {
      return NextResponse.json(
        { success: false, error: rowError.message },
        { status: 500 }
      );
    }

    const stripeAccountId = row?.stripe_account_id?.trim();
    if (!stripeAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No Stripe account linked for this business yet.',
        },
        { status: 404 }
      );
    }

    const stripe = getStripePlatform();
    const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);

    if (!loginLink?.url) {
      return NextResponse.json(
        { success: false, error: 'Stripe did not return a dashboard link.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, url: loginLink.url });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Could not open Stripe dashboard.';
    console.error('POST /api/stripe/connect/express-dashboard', e);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
