import type { PublicProfileReview } from '@/features/reviews/types/publicProfile';
import { mapGoogleStarRating } from './googleReviewStarRating';

export type GoogleReviewApiRow = {
  reviewId?: unknown;
  name?: unknown;
  comment?: unknown;
  starRating?: unknown;
  createTime?: unknown;
  updateTime?: unknown;
  reviewer?: {
    displayName?: unknown;
    profilePhotoUrl?: unknown;
    isAnonymous?: unknown;
  };
  reviewReply?: {
    comment?: unknown;
    updateTime?: unknown;
  };
};

export type MappedGoogleReviewRow = {
  providerReviewId: string;
  rating: number;
  body: string;
  authorDisplayName: string;
  authorPhotoUrl: string | null;
  isAnonymous: boolean;
  providerCreateTime: string;
  providerUpdateTime: string | null;
  ownerReplyBody: string | null;
  ownerRepliedAt: string | null;
  publicReview: PublicProfileReview;
};

function reviewIdFromRow(row: GoogleReviewApiRow): string | null {
  if (typeof row.reviewId === 'string' && row.reviewId.trim()) {
    return row.reviewId.trim();
  }
  if (typeof row.name === 'string' && row.name.includes('/reviews/')) {
    const id = row.name.split('/reviews/').pop()?.trim();
    return id || null;
  }
  return null;
}

export function mapGoogleReviewApiRow(
  row: GoogleReviewApiRow
): MappedGoogleReviewRow | null {
  const providerReviewId = reviewIdFromRow(row);
  const rating = mapGoogleStarRating(row.starRating);
  const createTime =
    typeof row.createTime === 'string' && row.createTime.trim()
      ? row.createTime
      : null;
  if (!providerReviewId || rating === null || !createTime) return null;

  const isAnonymous = row.reviewer?.isAnonymous === true;
  const authorDisplayName =
    typeof row.reviewer?.displayName === 'string' &&
    row.reviewer.displayName.trim()
      ? row.reviewer.displayName.trim()
      : isAnonymous
        ? 'Google user'
        : 'Google user';
  const body = typeof row.comment === 'string' ? row.comment.trim() : '';
  const replyBody =
    typeof row.reviewReply?.comment === 'string' &&
    row.reviewReply.comment.trim()
      ? row.reviewReply.comment.trim()
      : null;
  const replyAt =
    typeof row.reviewReply?.updateTime === 'string' &&
    row.reviewReply.updateTime.trim()
      ? row.reviewReply.updateTime
      : null;
  const authorPhotoUrl =
    typeof row.reviewer?.profilePhotoUrl === 'string' &&
    row.reviewer.profilePhotoUrl.trim()
      ? row.reviewer.profilePhotoUrl.trim()
      : null;
  const providerUpdateTime =
    typeof row.updateTime === 'string' && row.updateTime.trim()
      ? row.updateTime
      : null;

  const publicReview: PublicProfileReview = {
    id: `google:${providerReviewId}`,
    authorDisplayName,
    rating,
    body,
    createdAt: createTime,
    source: 'google',
    ownerReply:
      replyBody && replyAt
        ? { body: replyBody, repliedAt: replyAt }
        : undefined,
  };

  return {
    providerReviewId,
    rating,
    body,
    authorDisplayName,
    authorPhotoUrl,
    isAnonymous,
    providerCreateTime: createTime,
    providerUpdateTime,
    ownerReplyBody: replyBody,
    ownerRepliedAt: replyBody ? replyAt : null,
    publicReview,
  };
}
