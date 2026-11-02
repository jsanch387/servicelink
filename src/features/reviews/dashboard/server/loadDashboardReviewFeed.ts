import { mapGoogleReviewRowToPublic } from '@/features/reviews/google-connect/server/loadGoogleReviews';
import { loadPublicReviewSummary } from '@/features/reviews/server/loadPublicReviewSummary';
import { deriveReviewsSummary } from '@/features/reviews/utils/deriveReviewsSummary';
import {
  PUBLIC_REVIEW_PAGE_SIZE,
  pageMergedPublicReviews,
} from '@/features/reviews/utils/pagePublicReviews';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PublicProfileReviewsSummary } from '../../types/publicProfile';
import type { DashboardReview } from '../types';
import {
  tryMapReviewRowToDashboardReview,
  type ReviewRowForDashboard,
} from './mapReviewRowToDashboardReview';

const MAX_OFFSET = 5000;

const SERVICE_LINK_SELECT =
  'id, author_display_name, rating, body, created_at, owner_reply_body, owner_replied_at, is_hidden';

const GOOGLE_SELECT =
  'id, author_display_name, rating, body, provider_create_time, owner_reply_body, owner_replied_at';

export type LoadDashboardReviewFeedResult =
  | {
      ok: true;
      reviews: DashboardReview[];
      hasMore: boolean;
      summary: PublicProfileReviewsSummary;
    }
  | { ok: false; status: number; error: string };

/**
 * One newest-first page of the owner inbox: ServiceLink reviews, including
 * hidden ones, merged with imported Google reviews.
 */
export async function loadDashboardReviewFeed(
  supabase: SupabaseClient,
  businessId: string,
  options?: { offset?: number; limit?: number }
): Promise<LoadDashboardReviewFeedResult> {
  const trimmedBusinessId = businessId?.trim();
  if (!trimmedBusinessId) {
    return { ok: false, status: 400, error: 'businessId is required' };
  }

  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? PUBLIC_REVIEW_PAGE_SIZE;
  if (
    !Number.isInteger(offset) ||
    offset < 0 ||
    offset > MAX_OFFSET ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50
  ) {
    return { ok: false, status: 400, error: 'Invalid review page' };
  }

  const window = offset + limit + 1;

  try {
    const admin = createSupabaseAdminClient();
    const [serviceLinkResult, googleResult, summaryResult] = await Promise.all([
      supabase
        .from('reviews')
        .select(SERVICE_LINK_SELECT)
        .eq('business_id', trimmedBusinessId)
        .order('created_at', { ascending: false })
        .limit(window),
      admin
        .from('google_reviews')
        .select(GOOGLE_SELECT)
        .eq('business_id', trimmedBusinessId)
        .order('provider_create_time', { ascending: false })
        .limit(window),
      loadPublicReviewSummary(supabase, trimmedBusinessId),
    ]);

    if (serviceLinkResult.error) {
      console.error(
        '[reviews] dashboard feed service link query failed',
        serviceLinkResult.error
      );
      return {
        ok: false,
        status: 500,
        error: serviceLinkResult.error.message || 'Failed to load reviews',
      };
    }
    if (googleResult.error) {
      console.error(
        '[reviews] dashboard feed google query failed',
        googleResult.error
      );
      return {
        ok: false,
        status: 500,
        error: googleResult.error.message || 'Failed to load reviews',
      };
    }

    const serviceLinkReviews = (
      (serviceLinkResult.data ?? []) as ReviewRowForDashboard[]
    )
      .map(row => tryMapReviewRowToDashboardReview(row))
      .filter((review): review is DashboardReview => review !== null);

    const googleReviews = (googleResult.data ?? [])
      .map(row => mapGoogleReviewRowToPublic(row))
      .filter((review): review is NonNullable<typeof review> => review !== null)
      .map(review => ({ ...review, isHidden: false }));

    const page = pageMergedPublicReviews(
      [...serviceLinkReviews, ...googleReviews],
      offset,
      limit
    );

    const summary =
      summaryResult.status === 'ok'
        ? summaryResult.summary
        : deriveReviewsSummary([]);

    return { ok: true, ...page, summary };
  } catch (err) {
    console.error('[reviews] dashboard feed failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Unexpected error loading reviews',
    };
  }
}
