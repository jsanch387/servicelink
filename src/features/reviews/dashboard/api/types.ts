import type { DashboardReview } from '../types';

export type ReviewsListResponse =
  | { success: true; reviews: DashboardReview[] }
  | { success: false; error: string };

export type ReviewUpdateResponse =
  | { success: true; review: DashboardReview }
  | { success: false; error: string };
