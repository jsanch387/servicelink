export type ReviewsDashboardFilterId = 'all' | 'needs_reply' | 'replied';

export type DashboardReview = {
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

export type DashboardReviewSummary = {
  averageRating: number;
  reviewCount: number;
};

export type RatingBreakdownRow = {
  stars: number;
  percent: number;
};
