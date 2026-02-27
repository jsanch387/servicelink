/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * POST /api/onboarding-v2/step1
 * Saves Step 1 (business name + business type). Creates business_profiles row if needed,
 * updates profiles.onboarding_step to 2. Auto-save on step navigation.
 */

import { saveStep1 } from '@/features/onboarding-v2/server/saveStep1';
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
    const { businessProfileId, businessName, businessType } = body as {
      businessProfileId?: string | null;
      businessName?: string;
      businessType?: string;
    };

    if (!businessName || typeof businessName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Business name is required' },
        { status: 400 }
      );
    }

    const result = await saveStep1(supabase as any, {
      profileId: user.id,
      businessProfileId: businessProfileId ?? null,
      businessName: businessName.trim(),
      businessType: typeof businessType === 'string' ? businessType.trim() : '',
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? 'Failed to save' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      businessProfileId: result.businessProfileId,
    });
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
