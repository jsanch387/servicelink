/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * POST /api/onboarding-v2/step3
 * Saves Step 3 (availability) to business_availability with accept_bookings: true,
 * then sets onboarding_step to 4.
 */

import { saveStep3 } from '@/features/onboarding-v2/server/saveStep3';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { businessProfileId, schedule, selectedPreset } = body as {
      businessProfileId?: string;
      schedule?: Record<string, unknown>;
      selectedPreset?: string | null;
    };

    if (!businessProfileId || typeof businessProfileId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Business profile is required' },
        { status: 400 }
      );
    }

    if (!schedule || typeof schedule !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Schedule is required' },
        { status: 400 }
      );
    }

    const result = await saveStep3(supabase as any, {
      profileId: user.id,
      businessProfileId: businessProfileId.trim(),
      schedule: schedule as any,
      selectedPreset:
        typeof selectedPreset === 'string' ? selectedPreset : null,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? 'Failed to save' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Something went wrong',
      },
      { status: 500 }
    );
  }
}
