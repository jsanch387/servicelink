import { describe, expect, it } from 'vitest';
import type { PublicProfileReview } from '../types/publicProfile';
import {
  PUBLIC_REVIEW_PAGE_SIZE,
  pageMergedPublicReviews,
} from '../utils/pagePublicReviews';

function review(
  id: string,
  createdAt: string,
  source?: PublicProfileReview['source']
): PublicProfileReview {
  return {
    id,
    authorDisplayName: id,
    rating: 5,
    body: 'Nice',
    createdAt,
    source,
  };
}

describe('pageMergedPublicReviews', () => {
  it('puts the newest review first across ServiceLink and Google', () => {
    const page = pageMergedPublicReviews(
      [
        review('sl-old', '2026-01-01T00:00:00.000Z'),
        review('g-new', '2026-06-01T00:00:00.000Z', 'google'),
        review('sl-new', '2026-05-01T00:00:00.000Z'),
      ],
      0,
      2
    );

    expect(page.reviews.map(item => item.id)).toEqual(['g-new', 'sl-new']);
    expect(page.hasMore).toBe(true);
  });

  it('returns the next page and clears hasMore on the last slice', () => {
    const reviews = Array.from({ length: PUBLIC_REVIEW_PAGE_SIZE + 1 }, (_, index) =>
      review(`r-${index}`, `2026-01-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`)
    );

    const first = pageMergedPublicReviews(reviews, 0, PUBLIC_REVIEW_PAGE_SIZE);
    expect(first.reviews).toHaveLength(PUBLIC_REVIEW_PAGE_SIZE);
    expect(first.reviews[0]?.id).toBe(`r-${PUBLIC_REVIEW_PAGE_SIZE}`);
    expect(first.hasMore).toBe(true);

    const second = pageMergedPublicReviews(
      reviews,
      PUBLIC_REVIEW_PAGE_SIZE,
      PUBLIC_REVIEW_PAGE_SIZE
    );
    expect(second.reviews.map(item => item.id)).toEqual(['r-0']);
    expect(second.hasMore).toBe(false);
  });
});
