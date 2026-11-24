import type { PublicProfileReviewsSummary } from '../../types/publicProfile';
import type { DashboardReview } from '../types';

export type ReviewsListResponse =
  | {
      success: true;
      reviews: DashboardReview[];
      hasMore: boolean;
      summary: PublicProfileReviewsSummary;
    }
  | { success: false; error: string };

export type ReviewUpdateResponse =
  | { success: true; review: DashboardReview }
  | { success: false; error: string };
