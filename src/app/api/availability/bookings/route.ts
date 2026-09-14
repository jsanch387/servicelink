/**
 * GET /api/availability/bookings
 *
 * Returns V2 (availability) bookings for the authenticated user's business.
 * Used by the dashboard Bookings page when "Accept Bookings" is on.
 */

import { listBookingsForBusiness } from '@/features/availability/services/bookingService';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const authResult = await requireBusinessPermission(
      supabase,
      'bookings.read'
    );
    if (!authResult.ok) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const bookings = await listBookingsForBusiness(
      supabase,
      authResult.businessId
    );

    return NextResponse.json({ success: true, data: bookings });
  } catch (err) {
    console.error('[API] GET /api/availability/bookings:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load bookings' },
      { status: 500 }
    );
  }
}
