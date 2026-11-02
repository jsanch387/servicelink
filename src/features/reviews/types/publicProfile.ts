export type PublicProfileReviewSource = 'servicelink' | 'google';

export type PublicProfileReview = {
  id: string;
  authorDisplayName: string;
  rating: number;
  body: string;
  createdAt: string;
  source?: PublicProfileReviewSource;
  ownerReply?: {
    body: string;
    repliedAt: string;
  };
};

export type PublicProfileRatingBreakdownRow = {
  stars: number;
  percent: number;
};

export type PublicProfileReviewsSummary = {
  averageRating: number;
  reviewCount: number;
  breakdown: PublicProfileRatingBreakdownRow[];
};

/** Visible public-profile reviews + aggregates. `null` when none to show. */
export type PublicProfileReviewsData = {
  reviews: PublicProfileReview[];
  summary: PublicProfileReviewsSummary;
  googleReviews?: PublicProfileReview[];
  googleSummary?: PublicProfileReviewsSummary | null;
};
