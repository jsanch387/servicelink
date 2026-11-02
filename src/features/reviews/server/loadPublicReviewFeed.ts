import { mapGoogleReviewRowToPublic } from '@/features/reviews/google-connect/server/loadGoogleReviews';
import type { PublicProfileReview } from '../types/publicProfile';
import {
  PUBLIC_REVIEW_PAGE_SIZE,
  pageMergedPublicReviews,
} from '../utils/pagePublicReviews';
import {
  tryMapReviewRowToPublicProfile,
  type ReviewRowForPublicProfile,
} from './mapReviewRowToPublicProfile';

const MAX_OFFSET = 5000;

export type LoadPublicReviewFeedResult =
  | { ok: true; reviews: PublicProfileReview[]; hasMore: boolean }
  | { ok: false; error: string };

/**
 * One newest-first page of visible ServiceLink reviews and imported Google
 * reviews. The window is `offset + limit + 1` from each table so the merge
 * is the real next page, not ServiceLink first and Google after.
 */
export async function loadPublicReviewFeed(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  businessId: string,
  options?: { offset?: number; limit?: number }
): Promise<LoadPublicReviewFeedResult> {
  const trimmedBusinessId = businessId?.trim();
  if (!trimmedBusinessId) {
    return { ok: false, error: 'businessId is required' };
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
    return { ok: false, error: 'Invalid review page' };
  }

  const window = offset + limit + 1;

  try {
    const [serviceLinkResult, googleResult] = await Promise.all([
      db
        .from('reviews')
        .select(
          'id, author_display_name, rating, body, created_at, owner_reply_body, owner_replied_at'
        )
        .eq('business_id', trimmedBusinessId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(window),
      db
        .from('google_reviews')
        .select(
          'id, author_display_name, rating, body, provider_create_time, owner_reply_body, owner_replied_at'
        )
        .eq('business_id', trimmedBusinessId)
        .order('provider_create_time', { ascending: false })
        .limit(window),
    ]);

    if (serviceLinkResult.error) {
      console.error(
        '[reviews] public feed service link query failed',
        serviceLinkResult.error
      );
      return {
        ok: false,
        error: serviceLinkResult.error.message ?? 'Failed to load reviews',
      };
    }
    if (googleResult.error) {
      console.error(
        '[reviews] public feed google query failed',
        googleResult.error
      );
      return {
        ok: false,
        error: googleResult.error.message ?? 'Failed to load reviews',
      };
    }

    const serviceLinkReviews = (
      (serviceLinkResult.data ?? []) as ReviewRowForPublicProfile[]
    )
      .map(row => tryMapReviewRowToPublicProfile(row))
      .filter((review): review is PublicProfileReview => review !== null);

    const googleReviews = ((googleResult.data ?? []) as unknown[])
      .map(row => mapGoogleReviewRowToPublic(row))
      .filter((review): review is PublicProfileReview => review !== null);

    return {
      ok: true,
      ...pageMergedPublicReviews(
        [...serviceLinkReviews, ...googleReviews],
        offset,
        limit
      ),
    };
  } catch (err) {
    console.error('[reviews] public feed failed', err);
    return { ok: false, error: 'Unexpected error loading reviews' };
  }
}
