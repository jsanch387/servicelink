import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { loadPublicReviewFeed } from '@/features/reviews/server/loadPublicReviewFeed';
import { PUBLIC_REVIEW_PAGE_SIZE } from '@/features/reviews/utils/pagePublicReviews';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { assertPublicProfileGetRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/public/profile/[slug]/reviews?offset=0
 * One newest-first page of ServiceLink and Google reviews.
 * The score card stays on the full ServiceLink summary from the profile page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const trimmedSlug = slug?.trim();

  if (!trimmedSlug) {
    return NextResponse.json(
      { success: false, error: 'Slug is required' },
      { status: 400 }
    );
  }

  try {
    const rateLimited = await assertPublicProfileGetRateLimits(
      request,
      trimmedSlug
    );
    if (rateLimited) return rateLimited;

    const admin = createSupabaseAdminClient();
    if (!(await isPublicBusinessSlugVisible(admin, trimmedSlug))) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: profileData, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('business_slug', trimmedSlug)
      .maybeSingle();
    const businessId = (profileData as { id?: string } | null)?.id?.trim();

    if (profileError || !businessId) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    const offsetParam = request.nextUrl.searchParams.get('offset');
    const offset = offsetParam == null || offsetParam === '' ? 0 : Number(offsetParam);
    if (!Number.isInteger(offset) || offset < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid review page' },
        { status: 400 }
      );
    }

    const feed = await loadPublicReviewFeed(admin, businessId, {
      offset,
      limit: PUBLIC_REVIEW_PAGE_SIZE,
    });
    if (!feed.ok) {
      return NextResponse.json(
        { success: false, error: feed.error },
        { status: feed.error === 'Invalid review page' ? 400 : 500 }
      );
    }

    if (offset === 0 && feed.reviews.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No reviews available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews: feed.reviews,
        hasMore: feed.hasMore,
      },
    });
  } catch (err) {
    console.error('[reviews] GET public profile reviews failed', err);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
