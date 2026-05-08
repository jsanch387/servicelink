/**
 * POST /api/stripe/connect/sync
 *
 * Pulls the latest Stripe Connect account state and updates `payment_accounts`.
 * Web runs the same logic on `/dashboard/payments?connect=return|refresh`;
 * mobile should call this after Account Link return/refresh deep links.
 *
 * Auth: cookies (web) or `Authorization: Bearer <access_token>` (mobile).
 */

import { getHasProAccessForPayments } from '@/features/payments/server/getHasProAccessForPayments';
import { syncConnectPaymentAccountForBusiness } from '@/features/payments/server/syncConnectPaymentAccount';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextRequest, NextResponse } from 'next/server';

const LOG = '[stripe:connect-sync]';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Stripe is not configured (missing STRIPE_SECRET_KEY). Add it to your environment.',
        },
        { status: 500 }
      );
    }

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

    const hasPro = await getHasProAccessForPayments(supabase, user.id);
    if (!hasPro) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pro subscription required to sync payment account',
        },
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

    const syncResult = await syncConnectPaymentAccountForBusiness(
      supabase,
      businessResolved.businessId
    );

    if (!syncResult.ok) {
      console.error(`${LOG} sync failed`, syncResult.error);
      return NextResponse.json(
        { success: false, error: syncResult.error },
        { status: 500 }
      );
    }

    if (syncResult.skipped) {
      return NextResponse.json({
        success: true,
        synced: false,
        skipped: true,
        reason: syncResult.reason,
      });
    }

    return NextResponse.json({ success: true, synced: true });
  } catch (e) {
    console.error(`${LOG} error`, e);
    return NextResponse.json(
      { success: false, error: 'Failed to sync Connect account' },
      { status: 500 }
    );
  }
}
