/**
 * POST /api/onboarding-v2/step2
 * Saves Step 2 (services) to business_services and sets onboarding_step to 3.
 */

import { saveStep2 } from '@/features/onboarding-v2/server/saveStep2';
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
    const { businessProfileId, services } = body as {
      businessProfileId?: string;
      services?: Array<{
        name?: string;
        price?: string;
        durationMinutes?: number;
        description?: string | null;
      }>;
    };

    if (!businessProfileId || typeof businessProfileId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Business profile is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(services)) {
      return NextResponse.json(
        { success: false, error: 'Services must be an array' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await saveStep2(supabase as any, {
      profileId: user.id,
      businessProfileId: businessProfileId.trim(),
      services: services.map(s => ({
        name: typeof s.name === 'string' ? s.name : '',
        price: typeof s.price === 'string' ? s.price : '',
        durationMinutes:
          typeof s.durationMinutes === 'number' ? s.durationMinutes : 60,
        description: typeof s.description === 'string' ? s.description : null,
      })),
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
