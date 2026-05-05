/**
 * PATCH /api/availability/bookings/[id]
 *
 * Owner-only (RLS): update status (completed / cancelled) or reschedule
 * (scheduledDate + startTime for confirmed bookings).
 */

import { mapBookingRowToDisplay } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import {
  rescheduleBookingForOwner,
  updateBookingStatus,
  type BookingStatusUpdate,
} from '@/features/availability/services/bookingService';
import { applyMaintenanceVisitCompletedFromBooking } from '@/features/maintenance/server/applyMaintenanceVisitCompletedFromBooking';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_STATUSES: BookingStatusUpdate[] = ['completed', 'cancelled'];

async function getAuthAndBusinessId(supabase: SupabaseClient) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Authentication required', status: 401 as const };
  }

  const { data: businessProfile, error: businessError } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('profile_id', user.id)
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

    const supabase = await createSupabaseServerClient();

    const authResult = await getAuthAndBusinessId(supabase);
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

      return NextResponse.json({
        success: true,
        data: mapBookingRowToDisplay(result.row),
      });
    }

    if (!status || !ALLOWED_STATUSES.includes(status as BookingStatusUpdate)) {
      return NextResponse.json(
        { success: false, error: 'Status must be "completed" or "cancelled"' },
        { status: 400 }
      );
    }

    const updated = await updateBookingStatus(
      supabase,
      bookingId,
      status as BookingStatusUpdate
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (status === 'completed') {
      try {
        const admin = createSupabaseAdminClient();
        await applyMaintenanceVisitCompletedFromBooking(admin, {
          id: updated.id,
          business_id: updated.business_id,
          customer_id: updated.customer_id,
        });
      } catch (sideErr) {
        console.error(
          '[API] PATCH booking maintenance completion side effects',
          sideErr
        );
      }
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
