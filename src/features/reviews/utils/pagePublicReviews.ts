import type { PublicProfileReview } from '../types/publicProfile';

/** First paint on the public Reviews tab. Older reviews load on demand. */
export const PUBLIC_REVIEW_PAGE_SIZE = 10;

/** Newest first. Same timestamp falls back to id so the order stays stable. */
export function comparePublicReviewsNewestFirst(
  a: Pick<PublicProfileReview, 'id' | 'createdAt'>,
  b: Pick<PublicProfileReview, 'id' | 'createdAt'>
): number {
  const time = Date.parse(b.createdAt) - Date.parse(a.createdAt);
  if (time !== 0 && Number.isFinite(time)) return time;
  return b.id.localeCompare(a.id);
}

/**
 * Page a merged ServiceLink + Google list.
 * Callers must pass the newest `offset + limit + 1` rows from each source
 * so this slice is the true global page.
 */
export function pageMergedPublicReviews<
  T extends Pick<PublicProfileReview, 'id' | 'createdAt'>,
>(
  reviews: T[],
  offset: number,
  limit: number
): { reviews: T[]; hasMore: boolean } {
  const start = Math.max(0, offset);
  const size = Math.max(1, limit);
  const sorted = [...reviews].sort(comparePublicReviewsNewestFirst);
  return {
    reviews: sorted.slice(start, start + size),
    hasMore: start + size < sorted.length,
  };
}
