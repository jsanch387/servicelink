/**
 * POST /api/availability/bookings/[id]/tap-to-pay/connection-token
 *
 * Returns a Stripe Terminal connection token for Tap to Pay SDK init.
 * Contract: docs/contracts/mobile-booking-tap-to-pay.md
 */

import { createTapToPayConnectionToken } from '@/features/availability/booking/server/createTapToPayConnectionToken';
import { resolveTapToPayBookingContext } from '@/features/availability/booking/server/resolveTapToPayBookingContext';
import { resolveTapToPayRouteAuth } from '@/features/availability/booking/server/resolveTapToPayRouteAuth';
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

    const tokenResult = await createTapToPayConnectionToken({
      stripeAccountId: ctxResult.ctx.stripeAccountId,
    });
    if (!tokenResult.ok) {
      return NextResponse.json(
        { success: false, error: tokenResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      secret: tokenResult.secret,
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
