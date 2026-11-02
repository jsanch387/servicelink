/**
 * API Route: List Booking Requests
 *
 * GET /api/booking-request/list
 *
 * Fetches all booking requests for the authenticated user's business.
 * Requires authentication.
 */

import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const resolved = await requireBusinessPermission(supabase, 'bookings.read');

    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const businessProfile = { id: resolved.businessId };

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Optional status filter

    // Build query
    let query = supabase
      .from('booking_requests')
      .select('*')
      .eq('business_id', businessProfile.id)
      .order('submitted_at', { ascending: false });

    // Apply status filter if provided
    if (
      status &&
      ['pending', 'approved', 'declined', 'cancelled'].includes(status)
    ) {
      query = query.eq('status', status);
    }

    const { data: bookingRequests, error } = await query;

    if (error) {
      console.error('Error fetching booking requests:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to fetch booking requests',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bookingRequests || [],
    });
  } catch (error) {
    console.error('Error in booking request list API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
