import { saveIndustry } from '@/features/onboarding-v3/server/saveIndustry';
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

    const body = (await request.json()) as {
      industry?: string;
      trades?: string[];
    };

    const result = await saveIndustry(supabase, {
      profileId: user.id,
      industry: typeof body.industry === 'string' ? body.industry : '',
      trades: Array.isArray(body.trades) ? body.trades : [],
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? 'Failed to save' },
        { status: result.statusCode ?? 400 }
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
