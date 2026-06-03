import { roundAverageRating } from '@/features/business-profile/reviews/utils/reviewDisplay';
import { computeRatingBreakdown } from '../server/computeRatingBreakdown';
import type {
  PublicProfileReview,
  PublicProfileReviewsSummary,
} from '../types/publicProfile';

/** Aggregate average, count, and star breakdown from visible reviews. */
export function deriveReviewsSummary(
  reviews: Pick<PublicProfileReview, 'rating'>[]
): PublicProfileReviewsSummary {
  const ratings = reviews.map(r => r.rating);
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? roundAverageRating(ratings.reduce((sum, n) => sum + n, 0) / reviewCount)
      : 0;

  return {
    averageRating,
    reviewCount,
    breakdown: computeRatingBreakdown(ratings),
  };
}
