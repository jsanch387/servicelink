/**
 * GET /api/availability/bookings
 *
 * Returns a page of V2 bookings (newest first) or the bookings in a date
 * range for the calendar. Used by the dashboard Bookings page.
 */

import { listBookingsForOwner } from '@/features/availability/booking/server/listBookingsForOwner';
import { parseListBookingsQuery } from '@/features/availability/booking/server/parseListBookingsQuery';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const parsed = parseListBookingsQuery(request.nextUrl.searchParams);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

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

    const page = await listBookingsForOwner(
      supabase,
      authResult.businessId,
      parsed.query
    );

    return NextResponse.json({
      success: true,
      data: page.bookings,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    });
  } catch (err) {
    console.error('[API] GET /api/availability/bookings:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load bookings' },
      { status: 500 }
    );
  }
}
