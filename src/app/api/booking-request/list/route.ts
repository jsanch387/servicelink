/**
 * API Route: List Booking Requests
 *
 * GET /api/booking-request/list
 *
 * Fetches all booking requests for the authenticated user's business.
 * Requires authentication.
 */

import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the user's business profile
    const {
      data: businessProfile,
      error: businessError,
    }: {
      data: { id: string } | null;
      error: unknown;
    } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (businessError || !businessProfile) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

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
