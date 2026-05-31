import type { PublicProfileReview } from '../types/publicProfile';

export type ReviewRowForPublicProfile = {
  id: string;
  author_display_name: string;
  rating: number;
  body: string;
  created_at: string;
  owner_reply_body: string | null;
  owner_replied_at: string | null;
};

function isValidRating(rating: unknown): rating is number {
  return (
    typeof rating === 'number' &&
    Number.isFinite(rating) &&
    rating >= 1 &&
    rating <= 5
  );
}

/** Returns null for malformed rows instead of throwing. */
export function tryMapReviewRowToPublicProfile(
  row: Partial<ReviewRowForPublicProfile> | null | undefined
): PublicProfileReview | null {
  if (!row?.id?.trim()) return null;
  if (!row.author_display_name?.trim()) return null;
  if (typeof row.body !== 'string') return null;
  if (!row.created_at?.trim()) return null;
  if (!isValidRating(row.rating)) return null;

  return mapReviewRowToPublicProfile({
    id: row.id.trim(),
    author_display_name: row.author_display_name.trim(),
    rating: Math.round(row.rating),
    body: row.body,
    created_at: row.created_at.trim(),
    owner_reply_body: row.owner_reply_body ?? null,
    owner_replied_at: row.owner_replied_at ?? null,
  });
}

export function mapReviewRowToPublicProfile(
  row: ReviewRowForPublicProfile
): PublicProfileReview {
  const replyBody = row.owner_reply_body?.trim();
  const repliedAt = row.owner_replied_at?.trim();

  return {
    id: row.id,
    authorDisplayName: row.author_display_name,
    rating: row.rating,
    body: row.body,
    createdAt: row.created_at,
    ownerReply:
      replyBody && repliedAt ? { body: replyBody, repliedAt } : undefined,
  };
}
