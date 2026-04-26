import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

function parseAddonDetailsForSummary(raw: unknown): Array<{
  id: string;
  name: string;
  priceCents: number;
  durationMinutes?: number | null;
}> {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(item => {
    if (typeof item !== 'object' || item === null) return [];
    const o = item as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id.trim() : '';
    const name = typeof o.name === 'string' ? o.name.trim() : '';
    const priceRaw = o.priceCents;
    const priceCents =
      typeof priceRaw === 'number' && Number.isFinite(priceRaw)
        ? Math.max(0, Math.round(priceRaw))
        : 0;
    const dm = o.durationMinutes;
    const durationMinutes =
      typeof dm === 'number' && Number.isFinite(dm) ? Math.round(dm) : null;
    if (!id || !name) return [];
    return [{ id, name, priceCents, durationMinutes }];
  });
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id')?.trim();
    const businessSlug = request.nextUrl.searchParams

      .get('businessSlug')
      ?.trim();
    if (!sessionId || !businessSlug) {
      return NextResponse.json(
        { success: false, error: 'session_id and businessSlug are required.' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (supabase as any)
      .from('booking_payments')
      .select(
        `
        payment_status,
        currency,
        total_amount_cents,
        paid_online_amount_cents,
        remaining_amount_cents,
        booking:bookings!inner(
          id,
          business_slug,
          service_name,
          scheduled_date,
          start_time,
          customer_name,
          duration_minutes,
          service_price_cents,
          addon_details,
          customer_vehicle_year,
          customer_vehicle_make,
          customer_vehicle_model
        )
      `
      )
      .eq('last_checkout_session_id', sessionId)
      .eq('booking.business_slug', businessSlug)
      .maybeSingle();

    if (error) {
      console.error('[booking-checkout-summary] query failed', error);
      return NextResponse.json(
        { success: false, error: 'Could not load checkout summary.' },
        { status: 500 }
      );
    }
    if (!row || !row.booking) {
      // Fallback: webhook may still be processing right after Stripe redirect.

      const { data: checkoutRow, error: checkoutLookupError } =
        await // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('booking_checkout_sessions')
          .select('status, booking_id')
          .eq('stripe_checkout_session_id', sessionId)
          .maybeSingle();

      if (checkoutLookupError) {
        console.error(
          '[booking-checkout-summary] checkout session lookup failed',
          checkoutLookupError
        );
        return NextResponse.json(
          { success: false, error: 'Could not load checkout summary.' },
          { status: 500 }
        );
      }

      const checkoutStatus = (checkoutRow as { status?: string | null } | null)
        ?.status;
      if (checkoutStatus === 'created' || checkoutStatus === 'completed') {
        return NextResponse.json(
          { success: false, pending: true, error: 'Checkout is processing.' },
          { status: 202 }
        );
      }
      if (checkoutStatus === 'failed') {
        return NextResponse.json(
          { success: false, error: 'Payment could not be finalized.' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Checkout summary not found.' },
        { status: 404 }
      );
    }

    const booking = row.booking as {
      id: string;
      service_name: string;
      scheduled_date: string;
      start_time: string;
      customer_name: string;
      duration_minutes?: number | null;
      service_price_cents?: number | null;
      addon_details?: unknown;
      customer_vehicle_year?: string | null;
      customer_vehicle_make?: string | null;
      customer_vehicle_model?: string | null;
    };

    return NextResponse.json({
      success: true,
      data: {
        paymentStatus: row.payment_status,
        currency: row.currency,
        totalAmountCents: row.total_amount_cents,
        paidOnlineAmountCents: row.paid_online_amount_cents,
        remainingAmountCents: row.remaining_amount_cents,
        booking: {
          id: booking.id,
          serviceName: booking.service_name,
          scheduledDate: booking.scheduled_date,
          startTime: booking.start_time,
          customerName: booking.customer_name,
          durationMinutes:
            typeof booking.duration_minutes === 'number' &&
            Number.isFinite(booking.duration_minutes)
              ? Math.max(1, Math.round(booking.duration_minutes))
              : null,
          servicePriceCents:
            typeof booking.service_price_cents === 'number' &&
            Number.isFinite(booking.service_price_cents)
              ? Math.max(0, Math.round(booking.service_price_cents))
              : null,
          selectedAddOns: parseAddonDetailsForSummary(booking.addon_details),
          customerVehicleYear: booking.customer_vehicle_year?.trim() || null,
          customerVehicleMake: booking.customer_vehicle_make?.trim() || null,
          customerVehicleModel: booking.customer_vehicle_model?.trim() || null,
        },
      },
    });
  } catch (err) {
    console.error('[booking-checkout-summary] unexpected error', err);
    return NextResponse.json(
      { success: false, error: 'Could not load checkout summary.' },
      { status: 500 }
    );
  }
}
