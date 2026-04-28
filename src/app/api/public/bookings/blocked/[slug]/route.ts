/**
 * GET /api/public/bookings/blocked/[slug]
 *
 * Returns minimal slot-blocking data for a business (no customer info).
 * Used by the public V2 booking flow to avoid double-booking.
 * Uses service role so we can read bookings for any business.
 */

import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Slug required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    if (!(await isPublicBusinessSlugVisible(supabase, slug))) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('business_slug', slug.trim())
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    const businessId = (profile as { id: string }).id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows, error } = await (supabase as any)
      .from('bookings')
      .select('scheduled_date, start_time, duration_minutes')
      .eq('business_id', businessId)
      .in('status', ['confirmed', 'completed']);

    if (error) {
      console.error('[API] GET blocked bookings:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load bookings' },
        { status: 500 }
      );
    }

    const blockedSlots = (rows || []).map(
      (r: {
        scheduled_date: string;
        start_time: string;
        duration_minutes: number;
      }) => ({
        date: r.scheduled_date,
        startTime: r.start_time?.toString().slice(0, 5) ?? '00:00',

        durationMinutes: r.duration_minutes ?? 60,
      })
    );

    return NextResponse.json({ success: true, blockedSlots });
  } catch (err) {
    console.error('[API] GET /api/public/bookings/blocked/[slug]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load blocked slots' },
      { status: 500 }
    );
  }
}
