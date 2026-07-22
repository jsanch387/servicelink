/**
 * POST /api/availability/bookings/[id]/tap-to-pay/client-event
 *
 * Best-effort mobile diagnostic report (failure or success) for Tap to Pay.
 * Updates booking_tap_to_pay_intents when paymentIntentId is known.
 */

import { recordTapToPayClientEvent } from '@/features/availability/booking/server/recordTapToPayClientEvent';
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

    // Lightweight ownership only — do not use resolveTapToPayBookingContext
    // (lifecycle gates would block best-effort diagnostics).
    const { data: bookingData, error: bookingError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth.supabase as any)
        .from('bookings')
        .select('id, business_id')
        .eq('id', bookingId)
        .maybeSingle();

    const booking = bookingData as {
      id: string;
      business_id: string;
    } | null;

    if (bookingError) {
      console.error(
        '[tap-to-pay] client-event booking load failed',
        bookingError
      );
      return NextResponse.json(
        { success: false, error: 'Could not save Tap to Pay client report.' },
        { status: 500 }
      );
    }

    if (!booking || booking.business_id !== auth.business.id) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const outcomeRaw =
      body && typeof body === 'object' && !Array.isArray(body)
        ? String((body as { outcome?: unknown }).outcome ?? 'failure')
            .trim()
            .toLowerCase()
        : 'failure';
    const outcome = outcomeRaw === 'success' ? 'success' : 'failure';

    const result = await recordTapToPayClientEvent({
      businessId: auth.business.id,
      bookingId,
      outcome,
      body,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.httpStatus }
      );
    }

    return NextResponse.json({ success: true, updated: result.updated });
  } catch (e) {
    console.error('[tap-to-pay] client-event route error', e);
    return NextResponse.json(
      { success: false, error: 'Could not save Tap to Pay client report.' },
      { status: 500 }
    );
  }
}
