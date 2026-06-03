import type { ReviewUpdateResponse } from '@/features/reviews/dashboard/api/types';
import { updateDashboardReview } from '@/features/reviews/dashboard/server/updateDashboardReview';
import { validateUpdateReviewBody } from '@/features/reviews/dashboard/server/validateUpdateReviewBody';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const reviewId = id?.trim();
    if (!reviewId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Review id is required',
        } satisfies ReviewUpdateResponse,
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const resolved = await resolveCurrentBusinessId(supabase);

    if (!resolved.ok) {
      return NextResponse.json(
        {
          success: false,
          error: resolved.error,
        } satisfies ReviewUpdateResponse,
        { status: resolved.status }
      );
    }

    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON body',
        } satisfies ReviewUpdateResponse,
        { status: 400 }
      );
    }

    const parsed = validateUpdateReviewBody(rawBody);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error } satisfies ReviewUpdateResponse,
        { status: 400 }
      );
    }

    const updated = await updateDashboardReview(
      supabase,
      resolved.businessId,
      reviewId,
      parsed.value
    );

    if (!updated.ok) {
      return NextResponse.json(
        { success: false, error: updated.error } satisfies ReviewUpdateResponse,
        { status: updated.status }
      );
    }

    return NextResponse.json({
      success: true,
      review: updated.review,
    } satisfies ReviewUpdateResponse);
  } catch (err) {
    console.error('[reviews] PATCH /api/reviews/[id] failed', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error',
      } satisfies ReviewUpdateResponse,
      { status: 500 }
    );
  }
}
