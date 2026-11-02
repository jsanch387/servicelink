import type { ReviewsListResponse } from '@/features/reviews/dashboard/api/types';
import { loadDashboardReviewFeed } from '@/features/reviews/dashboard/server/loadDashboardReviewFeed';
import { PUBLIC_REVIEW_PAGE_SIZE } from '@/features/reviews/utils/pagePublicReviews';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error } satisfies ReviewsListResponse,
        { status: 401 }
      );
    }

    const resolved = await requireBusinessPermission(
      auth.supabase,
      'reviews.read'
    );

    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error } satisfies ReviewsListResponse,
        { status: resolved.status }
      );
    }

    const offsetParam = new URL(request.url).searchParams.get('offset');
    const offset =
      offsetParam == null || offsetParam === '' ? 0 : Number(offsetParam);
    if (!Number.isInteger(offset) || offset < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid review page',
        } satisfies ReviewsListResponse,
        { status: 400 }
      );
    }

    const feed = await loadDashboardReviewFeed(
      auth.supabase,
      resolved.businessId,
      {
        offset,
        limit: PUBLIC_REVIEW_PAGE_SIZE,
      }
    );

    if (!feed.ok) {
      return NextResponse.json(
        { success: false, error: feed.error } satisfies ReviewsListResponse,
        { status: feed.status }
      );
    }

    return NextResponse.json({
      success: true,
      reviews: feed.reviews,
      hasMore: feed.hasMore,
      summary: feed.summary,
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
