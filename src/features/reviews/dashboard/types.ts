import type {
  PublicProfileRatingBreakdownRow,
  PublicProfileReview,
} from '../types/publicProfile';

export type ReviewsDashboardFilterId = 'all' | 'needs_reply' | 'replied';

/** Same shape as public profile reviews — one type for customer-visible content. */
export type DashboardReview = PublicProfileReview;

export type DashboardReviewSummary = {
  averageRating: number;
  reviewCount: number;
};

export type RatingBreakdownRow = PublicProfileRatingBreakdownRow;
