export type PublicProfileReview = {
  id: string;
  authorDisplayName: string;
  rating: number;
  body: string;
  createdAt: string;
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
};
