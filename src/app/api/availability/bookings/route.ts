/**
 * GET /api/availability/bookings
 *
 * Returns V2 (availability) bookings for the authenticated user's business.
 * Used by the dashboard Bookings page when "Accept Bookings" is on.
 */

import { listBookingsForBusiness } from '@/features/availability/services/bookingService';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function getAuthAndBusinessId(
  supabase: ReturnType<typeof createServerClient>
) {
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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const authResult = await getAuthAndBusinessId(supabase);
    if ('status' in authResult) {
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
