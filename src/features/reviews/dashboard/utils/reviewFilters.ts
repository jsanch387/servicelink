import type { DashboardReview, ReviewsDashboardFilterId } from '../types';

export function reviewNeedsReply(review: DashboardReview): boolean {
  return !review.ownerReply?.body?.trim();
}

export function reviewMatchesFilter(
  review: DashboardReview,
  filter: ReviewsDashboardFilterId
): boolean {
  if (filter === 'all') return true;
  if (filter === 'needs_reply') return reviewNeedsReply(review);
  return !reviewNeedsReply(review);
}

export function countReviewsNeedingReply(reviews: DashboardReview[]): number {
  return reviews.filter(reviewNeedsReply).length;
}
