import type { LoadPublicReviewSummaryResult } from '../types/loadResults';
import type { PublicProfileReviewsSummary } from '../types/publicProfile';
import { deriveReviewsSummary } from '../utils/deriveReviewsSummary';

const STAR_RATINGS = [1, 2, 3, 4, 5] as const;

/**
 * Header rating + Reviews tab score. Counts every visible ServiceLink review,
 * not a recent page, so a long history still shows the real average.
 */
export async function loadPublicReviewSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  businessId: string
): Promise<LoadPublicReviewSummaryResult> {
  const trimmedBusinessId = businessId?.trim();
  if (!trimmedBusinessId) {
    return { status: 'error', message: 'businessId is required' };
  }

  try {
    const counts = await Promise.all(
      STAR_RATINGS.map(async star => {
        const { count, error } = await db
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', trimmedBusinessId)
          .eq('is_hidden', false)
          .eq('rating', star);
        return { star, count: count ?? 0, error };
      })
    );

    const failed = counts.find(row => row.error);
    if (failed?.error) {
      console.error(
        '[reviews] loadPublicReviewSummary query failed',
        failed.error
      );
      return {
        status: 'error',
        message: failed.error.message ?? 'Failed to load review summary',
      };
    }

    const ratings: number[] = counts.flatMap(({ star, count }) =>
      Array.from({ length: count }, () => star)
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
