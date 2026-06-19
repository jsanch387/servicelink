/**
 * POST /api/availability/bookings/[id]/tap-to-pay/intent
 *
 * Creates a Stripe PaymentIntent for Tap to Pay on the Complete sheet.
 * Contract: docs/contracts/mobile-booking-tap-to-pay.md
 */

import { createBookingTapToPayIntent } from '@/features/availability/booking/server/createBookingTapToPayIntent';
import { parseTapToPayIntentBody } from '@/features/availability/booking/server/parseTapToPayIntentBody';
import {
  computeTapToPayAmountDue,
  resolveTapToPayBookingContext,
} from '@/features/availability/booking/server/resolveTapToPayBookingContext';
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

    const rawBody = await request.json().catch(() => ({}));
    const parsed = parseTapToPayIntentBody(rawBody);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
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

    const amountDue = computeTapToPayAmountDue(
      ctxResult.ctx,
      parsed.body.sessionFees
    );
    if (amountDue.amountDueCents <= 0) {
      return NextResponse.json(
        { success: false, error: 'Nothing to collect for this booking.' },
        { status: 400 }
      );
    }

    const intentResult = await createBookingTapToPayIntent({
      ctx: ctxResult.ctx,
      sessionFees: parsed.body.sessionFees,
      amountCents: amountDue.amountDueCents,
    });
    if (!intentResult.ok) {
      return NextResponse.json(
        { success: false, error: intentResult.error },
        { status: intentResult.httpStatus }
      );
    }

    return NextResponse.json({
      success: true,
      paymentIntentId: intentResult.paymentIntentId,
      clientSecret: intentResult.clientSecret,
      amountCents: intentResult.amountCents,
      currency: intentResult.currency,
    });
  } catch (e) {
    console.error('[tap-to-pay:intent]', e);
    return NextResponse.json(
      {
        success: false,
        error: "Couldn't start Tap to Pay. Try again or mark as paid.",
      },
      { status: 500 }
    );
  }
}
