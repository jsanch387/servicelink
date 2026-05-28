/**
 * Public profile reviews — UI components, mock data, and shared utilities.
 * Replace mock constants with API/DB when the reviews backend ships.
 */

export { ReviewsSection } from './components/ReviewsSection';
export { ProfileRatingSummary } from './components/ProfileRatingSummary';
export { ProfileReviewCard } from './components/ProfileReviewCard';
export { ProfileReviewsSummary } from './components/ProfileReviewsSummary';
export { StarRatingDisplay } from './components/StarRatingDisplay';
export type { StarRatingDisplaySize } from './components/StarRatingDisplay';

export {
  MOCK_PROFILE_REVIEWS,
  MOCK_PROFILE_REVIEW_SUMMARY,
  MOCK_PROFILE_RATING_BREAKDOWN,
} from './constants/mockProfileReviews';
export type { MockProfileReview } from './constants/mockProfileReviews';

export {
  PROFILE_REVIEW_STAR_COLOR,
  profileReviewStarTextClass,
} from './constants/reviewStars';

export { formatAverageRating, formatReviewDate } from './utils/reviewDisplay';
