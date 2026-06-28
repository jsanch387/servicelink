import { saveSignupAttribution } from '@/features/marketing-attribution/server/saveSignupAttribution';
import { assertSignupAttributionRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/attribution/signup
 * Write-once first-touch attribution for new signups (authenticated).
 */
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

    const rateLimited = await assertSignupAttributionRateLimits(
      request,
      user.id
    );
    if (rateLimited) return rateLimited;

    const body = (await request.json()) as Record<string, unknown>;
    const result = await saveSignupAttribution(supabase, user.id, body);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: { recorded: result.recorded },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
