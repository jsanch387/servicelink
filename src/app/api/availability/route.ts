/**
 * GET /api/availability – load current user's business availability.
 * POST /api/availability – save (insert or update) availability.
 */

import {
  getAvailabilityForBusiness,
  upsertAvailabilityForBusiness,
} from '@/features/availability/services/availabilityService';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

  return { businessId: businessProfile.id };
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const authResult = await getAuthAndBusinessId(supabase);
    if ('status' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const data = await getAvailabilityForBusiness(
      supabase,
      authResult.businessId
    );

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[API] GET /api/availability:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load availability' },
      { status: 500 }
    );
  }
}

const MINIMUM_NOTICE_VALUES = ['none', '1h', '2h', '4h', '24h'] as const;
const SELECTED_PRESET_VALUES = [
  'mon_fri_9_5',
  'mon_sat_8_6',
  'weekends_only',
  'custom',
] as const;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const authResult = await getAuthAndBusinessId(supabase);
    if ('status' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const acceptBookings = Boolean(body.acceptBookings);
    const schedule = body.schedule ?? null;
    const minimumNotice =
      typeof body.minimumNotice === 'string' &&
      MINIMUM_NOTICE_VALUES.includes(body.minimumNotice)
        ? body.minimumNotice
        : 'none';
    const selectedPreset =
      typeof body.selectedPreset === 'string' &&
      SELECTED_PRESET_VALUES.includes(
        body.selectedPreset as (typeof SELECTED_PRESET_VALUES)[number]
      )
        ? body.selectedPreset
        : 'custom';

    if (!schedule || typeof schedule !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid schedule' },
        { status: 400 }
      );
    }

    const data = await upsertAvailabilityForBusiness(
      supabase,
      authResult.businessId,
      {
        accept_bookings: acceptBookings,
        minimum_notice: minimumNotice,
        weekly_schedule: schedule,
        selected_preset: selectedPreset,
      }
    );

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[API] POST /api/availability:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to save availability' },
      { status: 500 }
    );
  }
}
