import { finishOnboarding } from '@/features/onboarding-v3/server/finishOnboarding';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { user, supabase } = auth;

    const body = (await request.json()) as {
      businessName?: string;
      slug?: string;
      phone?: string;
      industry?: string;
      trades?: string[];
    };

    const result = await finishOnboarding(supabase, {
      profileId: user.id,
      userEmail: user.email ?? null,
      businessName:
        typeof body.businessName === 'string' ? body.businessName : '',
      slug: typeof body.slug === 'string' ? body.slug : '',
      phoneDigits: typeof body.phone === 'string' ? body.phone : '',
      industry: typeof body.industry === 'string' ? body.industry : '',
      trades: Array.isArray(body.trades) ? body.trades : [],
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? 'Could not finish setup' },
        { status: result.statusCode ?? 400 }
      );
    }

    return NextResponse.json({
      success: true,
      slug: result.slug,
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
