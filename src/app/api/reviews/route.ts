import type { ReviewsListResponse } from '@/features/reviews/dashboard/api/types';
import { loadDashboardReviews } from '@/features/reviews/dashboard/server/loadDashboardReviews';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const resolved = await resolveCurrentBusinessId(supabase);

    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error } satisfies ReviewsListResponse,
        { status: resolved.status }
      );
    }

    const loaded = await loadDashboardReviews(supabase, resolved.businessId);

    if (!loaded.ok) {
      return NextResponse.json(
        { success: false, error: loaded.error } satisfies ReviewsListResponse,
        { status: loaded.status }
      );
    }

    return NextResponse.json({
      success: true,
      reviews: loaded.reviews,
    } satisfies ReviewsListResponse);
  } catch (err) {
    console.error('[reviews] GET /api/reviews failed', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error',
      } satisfies ReviewsListResponse,
      { status: 500 }
    );
  }
}
