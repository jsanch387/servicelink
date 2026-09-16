/**
 * API Route: Update Booking Request Status
 *
 * PATCH /api/booking-request/update
 *
 * Updates the status of a booking request.
 * Requires authentication and ownership verification.
 */

import { BookingRequestService } from '@/features/booking-request/services/bookingRequestService';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface UpdateBookingRequestBody {
  requestId: string;
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  statusNotes?: string;
}

export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient();

    const resolved = await requireBusinessPermission(
      supabase,
      'bookings.write'
    );
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    // Parse request body
    const body: UpdateBookingRequestBody = await request.json();
    const { requestId, status, statusNotes } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { success: false, error: 'Request ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'declined', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid status. Must be pending, approved, declined, or cancelled',
        },
        { status: 400 }
      );
    }

    const businessProfile = { id: resolved.businessId };

    // Verify the booking request belongs to this business
    const {
      data: bookingRequest,
      error: bookingError,
    }: {
      data: { id: string; business_id: string } | null;
      error: unknown;
    } = await supabase
      .from('booking_requests')
      .select('id, business_id')
      .eq('id', requestId)
      .single();

    if (bookingError || !bookingRequest) {
      return NextResponse.json(
        { success: false, error: 'Booking request not found' },
        { status: 404 }
      );
    }

    if (bookingRequest.business_id !== businessProfile.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update the booking request status
    const result = await BookingRequestService.updateBookingRequestStatus(
      requestId,
      status,
      statusNotes
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to update booking request',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in booking request update API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
