import type { LoadPublicBusinessReviewsResult } from '../types/loadResults';
import type { PublicProfileReviewsData } from '../types/publicProfile';
import { deriveReviewsSummary } from '../utils/deriveReviewsSummary';
import {
  tryMapReviewRowToPublicProfile,
  type ReviewRowForPublicProfile,
} from './mapReviewRowToPublicProfile';

const DEFAULT_LIMIT = 50;

/**
 * Visible reviews for a public business profile (`is_hidden = false`).
 * Distinguishes empty (no reviews) from query/runtime errors.
 */
export async function loadPublicBusinessReviews(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  businessId: string,
  options?: { limit?: number }
): Promise<LoadPublicBusinessReviewsResult> {
  const trimmedBusinessId = businessId?.trim();
  if (!trimmedBusinessId) {
    return { status: 'error', message: 'businessId is required' };
  }

  const limit = options?.limit ?? DEFAULT_LIMIT;

  try {
    const { data, error } = await db
      .from('reviews')
      .select(
        'id, author_display_name, rating, body, created_at, owner_reply_body, owner_replied_at'
      )
      .eq('business_id', trimmedBusinessId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[reviews] loadPublicBusinessReviews query failed', error);
      return {
        status: 'error',
        message: error.message ?? 'Failed to load reviews',
      };
    }

    const rows = (data ?? []) as ReviewRowForPublicProfile[];
    const reviews = rows
      .map(row => tryMapReviewRowToPublicProfile(row))
      .filter(
        (review): review is NonNullable<typeof review> => review !== null
      );

    if (rows.length > reviews.length) {
      console.warn('[reviews] loadPublicBusinessReviews skipped invalid rows', {
        businessId: trimmedBusinessId,
        skipped: rows.length - reviews.length,
      });
    }

    if (reviews.length === 0) {
      return { status: 'empty' };
    }

    return {
      status: 'ok',
      data: {
        reviews,
        summary: deriveReviewsSummary(reviews),
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unexpected error loading reviews';
    console.error('[reviews] loadPublicBusinessReviews failed', err);
    return { status: 'error', message };
  }
}

/**
 * Public profile UI treats reviews as optional: hide tab/rating when empty or on error.
 */
export function publicReviewsDataFromLoadResult(
  result: LoadPublicBusinessReviewsResult
): PublicProfileReviewsData | null {
  return result.status === 'ok' ? result.data : null;
}
