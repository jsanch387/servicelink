import type { LoadPublicReviewSummaryResult } from '../types/loadResults';
import type { PublicProfileReviewsSummary } from '../types/publicProfile';
import { deriveReviewsSummary } from '../utils/deriveReviewsSummary';

const DEFAULT_LIMIT = 50;

function isValidRating(rating: unknown): rating is number {
  return (
    typeof rating === 'number' &&
    Number.isFinite(rating) &&
    rating >= 1 &&
    rating <= 5
  );
}

/**
 * Lightweight load for header rating + Reviews tab visibility (ratings only, no bodies).
 */
export async function loadPublicReviewSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  businessId: string,
  options?: { limit?: number }
): Promise<LoadPublicReviewSummaryResult> {
  const trimmedBusinessId = businessId?.trim();
  if (!trimmedBusinessId) {
    return { status: 'error', message: 'businessId is required' };
  }

  const limit = options?.limit ?? DEFAULT_LIMIT;

  try {
    const { data, error } = await db
      .from('reviews')
      .select('rating')
      .eq('business_id', trimmedBusinessId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[reviews] loadPublicReviewSummary query failed', error);
      return {
        status: 'error',
        message: error.message ?? 'Failed to load review summary',
      };
    }

    const ratings: number[] = (data ?? []).flatMap(
      (row: { rating?: unknown }) => {
        const value = row.rating;
        return isValidRating(value) ? [Math.round(value)] : [];
      }
    );

    if (ratings.length === 0) {
      return { status: 'empty' };
    }

    const summary: PublicProfileReviewsSummary = deriveReviewsSummary(
      ratings.map(rating => ({ rating }))
    );

    return { status: 'ok', summary };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'Unexpected error loading review summary';
    console.error('[reviews] loadPublicReviewSummary failed', err);
    return { status: 'error', message };
  }
}

export function publicReviewSummaryFromLoadResult(
  result: LoadPublicReviewSummaryResult
): PublicProfileReviewsSummary | null {
  return result.status === 'ok' ? result.summary : null;
}
