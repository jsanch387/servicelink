/**
 * PATCH /api/availability/bookings/[id]
 *
 * Updates a V2 booking's status (completed or cancelled). Auth required; RLS
 * ensures only the business owner can update their bookings.
 */

import { mapBookingRowToDisplay } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import {
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

    const body = await request.json().catch(() => ({}));
    const status = body.status as string | undefined;
    if (!status || !ALLOWED_STATUSES.includes(status as BookingStatusUpdate)) {
      return NextResponse.json(
        { success: false, error: 'Status must be "completed" or "cancelled"' },
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
