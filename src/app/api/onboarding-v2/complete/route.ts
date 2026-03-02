/**
 * POST /api/onboarding-v2/complete
 * Marks onboarding as complete (onboarding_status = 'completed', step 5).
 */

import { completeOnboardingV2 } from '@/features/onboarding-v2/server/completeOnboarding';
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

    const result = await completeOnboardingV2(supabase as any, user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? 'Failed to complete' },
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
