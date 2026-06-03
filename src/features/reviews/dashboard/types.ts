import type {
  PublicProfileRatingBreakdownRow,
  PublicProfileReview,
} from '../types/publicProfile';

export type ReviewsDashboardFilterId = 'all' | 'needs_reply' | 'replied';

/** Owner inbox review — includes visibility flag (hidden rows stay in dashboard). */
export type DashboardReview = PublicProfileReview & {
  isHidden: boolean;
};

export type DashboardReviewSummary = {
  averageRating: number;
  reviewCount: number;
};

export type RatingBreakdownRow = PublicProfileRatingBreakdownRow;
