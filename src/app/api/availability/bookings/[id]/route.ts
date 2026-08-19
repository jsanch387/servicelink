/**
 * PATCH /api/availability/bookings/[id]
 *
 * Owner-only (RLS): update status (completed / cancelled) or reschedule
 * (scheduledDate + startTime for confirmed bookings).
 *
 * DELETE /api/availability/bookings/[id]
 *
 * Owner-only (RLS): permanently remove the booking.
 *
 * Auth: `getAuthenticatedUser` (mobile Bearer or web cookie) — same as `/actions`.
 */

import { mapBookingRowToDisplay } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import { attachPaymentSummaryToDisplay } from '@/features/availability/booking/dashboard/utils/attachPaymentSummaryToDisplay';
import {
  deleteBookingForOwner,
  rescheduleBookingForOwner,
  updateBookingStatus,
  type BookingStatusUpdate,
} from '@/features/availability/services/bookingService';
import { completeBookingWithSideEffects } from '@/features/availability/services/completeBookingWithSideEffects';
import { getReviewInviteRequestId } from '@/features/reviews/server/reviewInviteRouteLog';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_STATUSES: BookingStatusUpdate[] = ['completed', 'cancelled'];

async function loadPaymentRowForBooking(
  supabase: SupabaseClient,
  bookingId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('booking_payments')
    .select(
      'payment_status, payment_method_selected, currency, total_amount_cents, paid_online_amount_cents, remaining_amount_cents'
    )
    .eq('booking_id', bookingId)
    .maybeSingle();

  return data as {
    payment_status: string | null;
    payment_method_selected: string | null;
    currency: string | null;
    total_amount_cents: number | null;
    paid_online_amount_cents: number | null;
    remaining_amount_cents: number | null;
  } | null;
}

async function getBusinessIdForOwner(
  supabase: SupabaseClient,
  profileId: string
) {
  const { data: businessProfile, error: businessError } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('profile_id', profileId)
    .single();

  if (businessError || !businessProfile) {
    return { error: 'Business profile not found', status: 404 as const };
  }

  return { businessId: businessProfile.id as string };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    if (!bookingId?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Booking ID required' },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const status = body.status as string | undefined;
    const scheduledDate =
      typeof body.scheduledDate === 'string' ? body.scheduledDate : undefined;
    const startTime =
      typeof body.startTime === 'string' ? body.startTime : undefined;

    const hasStatus = Boolean(status?.trim());
    const hasReschedule =
      Boolean(scheduledDate?.trim()) && Boolean(startTime?.trim());

    if (hasStatus && hasReschedule) {
      return NextResponse.json(
        {
          success: false,
          error: 'Send either status or scheduledDate/startTime, not both.',
        },
        { status: 400 }
      );
    }

    if (!hasStatus && !hasReschedule) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Provide status ("completed" | "cancelled") or scheduledDate + startTime to reschedule.',
        },
        { status: 400 }
      );
    }

    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { supabase, user } = auth;
    const authResult = await getBusinessIdForOwner(supabase, user.id);
    if ('status' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { businessId } = authResult;

    if (hasReschedule) {
      const d = scheduledDate!.trim();
      const t = startTime!.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return NextResponse.json(
          { success: false, error: 'scheduledDate must be YYYY-MM-DD' },
          { status: 400 }
        );
      }
      if (!/^\d{1,2}:\d{2}$/.test(t)) {
        return NextResponse.json(
          { success: false, error: 'startTime must be HH:mm (24-hour)' },
          { status: 400 }
        );
      }

      const result = await rescheduleBookingForOwner(supabase, {
        businessId,
        bookingId: bookingId.trim(),
        scheduledDate: d,
        startTimeHHmm: t,
      });

      if (!result.ok) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.httpStatus }
        );
      }

      const payment = await loadPaymentRowForBooking(
        supabase,
        bookingId.trim()
      );
      const display = attachPaymentSummaryToDisplay(
        mapBookingRowToDisplay(result.row),
        result.row,
        payment
      );

      return NextResponse.json({
        success: true,
        data: display,
      });
    }

    if (!status || !ALLOWED_STATUSES.includes(status as BookingStatusUpdate)) {
      return NextResponse.json(
        { success: false, error: 'Status must be "completed" or "cancelled"' },
        { status: 400 }
      );
    }

    // Completion runs the shared lifecycle path (status + maintenance + the
    // single SMS-first/email-fallback completion notification) so web and the
    // mobile `job_completed` action behave identically.
    const updated =
      status === 'completed'
        ? ((
            await completeBookingWithSideEffects(
              supabase as SupabaseClient<Database>,
              createSupabaseAdminClient(),
              bookingId,
              {
                requestId: getReviewInviteRequestId(request),
                source: 'web_patch',
              }
            )
          )?.booking ?? null)
        : await updateBookingStatus(
            supabase as SupabaseClient<Database>,
            bookingId,
            status as BookingStatusUpdate
          );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mapBookingRowToDisplay(updated),
    });
  } catch (err) {
    console.error('[API] PATCH /api/availability/bookings/[id]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    if (!bookingId?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Booking ID required' },
        { status: 400 }
      );
    }

    const auth = await getAuthenticatedUser(_request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const authResult = await getBusinessIdForOwner(auth.supabase, auth.user.id);
    if ('status' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const result = await deleteBookingForOwner(auth.supabase, {
      businessId: authResult.businessId,
      bookingId: bookingId.trim(),
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.httpStatus }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] DELETE /api/availability/bookings/[id]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}
