/**
 * POST /api/stripe/connect/onboard
 *
 * Ephemeral MVP: opens Stripe-hosted Connect Express onboarding (no app DB).
 * Core logic: `startExpressConnectOnboarding` in `@/features/payments/stripe`.
 */

import { getHasProAccessForPayments } from '@/features/payments/server/getHasProAccessForPayments';
import { startExpressConnectOnboarding } from '@/features/payments/stripe';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secret) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Stripe is not configured (missing STRIPE_SECRET_KEY). Add it to your environment.',
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
        { success: false, error: 'Pro subscription required to connect payments' },
        { status: 403 }
      );
    }

    const { url } = await startExpressConnectOnboarding({
      request,
      user: { id: user.id, email: user.email ?? undefined },
    });

    return NextResponse.json({ success: true, url });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    console.error('POST /api/stripe/connect/onboard', e);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
