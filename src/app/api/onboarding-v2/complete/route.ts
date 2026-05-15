/**
 * POST /api/onboarding-v2/complete
 * Marks onboarding complete (Step 5 “Activate my link”, Free tier) and sends the
 * welcome-live email once when transitioning to completed (same rules as the Stripe trial bridge).
 */

import { completeOnboardingV2WithWelcomeLiveEmail } from '@/features/onboarding-v2/server/completeOnboarding';
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

    const result = await completeOnboardingV2WithWelcomeLiveEmail(
      supabase as any,
      user.id,
      user.email
    );

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
