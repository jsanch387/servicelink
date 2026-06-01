import {
  mapReviewRowToPublicProfile,
  type ReviewRowForPublicProfile,
} from '../../server/mapReviewRowToPublicProfile';
import type { DashboardReview } from '../types';

export type ReviewRowForDashboard = ReviewRowForPublicProfile & {
  is_hidden: boolean;
};

function isValidRating(rating: unknown): rating is number {
  return (
    typeof rating === 'number' &&
    Number.isFinite(rating) &&
    rating >= 1 &&
    rating <= 5
  );
}

export function mapReviewRowToDashboardReview(
  row: ReviewRowForDashboard
): DashboardReview {
  return {
    ...mapReviewRowToPublicProfile(row),
    isHidden: row.is_hidden,
  };
}

/** Returns null for malformed rows instead of throwing. */
export function tryMapReviewRowToDashboardReview(
  row: Partial<ReviewRowForDashboard> | null | undefined
): DashboardReview | null {
  if (!row?.id?.trim()) return null;
  if (!row.author_display_name?.trim()) return null;
  if (typeof row.body !== 'string') return null;
  if (!row.created_at?.trim()) return null;
  if (!isValidRating(row.rating)) return null;
  if (typeof row.is_hidden !== 'boolean') return null;

  return mapReviewRowToDashboardReview({
    id: row.id.trim(),
    author_display_name: row.author_display_name.trim(),
    rating: Math.round(row.rating),
    body: row.body,
    created_at: row.created_at.trim(),
    owner_reply_body: row.owner_reply_body ?? null,
    owner_replied_at: row.owner_replied_at ?? null,
    is_hidden: row.is_hidden,
  });
}
