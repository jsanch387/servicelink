/**
 * POST /api/availability/bookings/[id]/tap-to-pay/connection-token
 *
 * Returns a Stripe Terminal connection token for Tap to Pay SDK init.
 * Contract: docs/contracts/mobile-booking-tap-to-pay.md
 */

import {
  parseTapToPayConnectionTokenBody,
  resolveTapToPayStripeAccountId,
} from '@/features/availability/booking/server/parseTapToPayConnectionTokenBody';
import { resolveTapToPayBookingContext } from '@/features/availability/booking/server/resolveTapToPayBookingContext';
import { resolveTapToPayRouteAuth } from '@/features/availability/booking/server/resolveTapToPayRouteAuth';
import { issueTapToPayConnectionToken } from '@/features/payments/server/issueTapToPayConnectionToken';
import {
  assertOwnerTapToPayConnectionTokenRateLimits,
  TAP_TO_PAY_RATE_LIMIT_ERROR,
} from '@/server/rateLimit/ownerTapToPayRateLimit';
import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const bookingId = id?.trim();
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID required' },
        { status: 400 }
      );
    }

    const auth = await resolveTapToPayRouteAuth(request);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.httpStatus }
      );
    }

    const rate = await assertOwnerTapToPayConnectionTokenRateLimits(
      request,
      auth.user.id
    );
    if (!rate.ok) {
      return NextResponse.json(
        { success: false, error: TAP_TO_PAY_RATE_LIMIT_ERROR },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSec) },
        }
      );
    }

    const rawBody = await request.json().catch(() => ({}));
    const parsedBody = parseTapToPayConnectionTokenBody(rawBody);
    if (!parsedBody.ok) {
      return NextResponse.json(
        { success: false, error: parsedBody.error },
        { status: 400 }
      );
    }

    const ctxResult = await resolveTapToPayBookingContext({
      supabase: auth.supabase,
      bookingId,
      businessId: auth.business.id,
    });
    if (!ctxResult.ok) {
      return NextResponse.json(
        { success: false, error: ctxResult.reject.error },
        { status: ctxResult.reject.httpStatus }
      );
    }

    const accountResult = resolveTapToPayStripeAccountId({
      bookingStripeAccountId: ctxResult.ctx.stripeAccountId,
      requestedStripeAccountId: parsedBody.body.stripeAccountId,
    });
    if (!accountResult.ok) {
      return NextResponse.json(
        { success: false, error: accountResult.error },
        { status: 400 }
      );
    }

    const tokenResult = await issueTapToPayConnectionToken({
      supabase: auth.supabase,
      businessId: auth.business.id,
      stripeAccountId: accountResult.stripeAccountId,
      logContext: 'tap-to-pay:connection-token',
    });
    if (!tokenResult.ok) {
      return NextResponse.json(
        { success: false, error: tokenResult.error },
        { status: tokenResult.httpStatus }
      );
    }

    return NextResponse.json({
      success: true,
      secret: tokenResult.secret,
      stripeAccountId: tokenResult.stripeAccountId,
      terminalLocationId: tokenResult.terminalLocationId,
    });
  } catch (e) {
    console.error('[tap-to-pay:connection-token]', e);
    return NextResponse.json(
      {
        success: false,
        error: "Couldn't connect to payments. Try again or mark as paid.",
      },
      { status: 500 }
    );
  }
}
