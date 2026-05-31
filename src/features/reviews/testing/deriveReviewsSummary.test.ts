import { describe, expect, it } from 'vitest';
import { deriveReviewsSummary } from '../utils/deriveReviewsSummary';

describe('deriveReviewsSummary', () => {
  it('returns zeroed summary for an empty list', () => {
    expect(deriveReviewsSummary([])).toEqual({
      averageRating: 0,
      reviewCount: 0,
      breakdown: [
        { stars: 5, percent: 0 },
        { stars: 4, percent: 0 },
        { stars: 3, percent: 0 },
        { stars: 2, percent: 0 },
        { stars: 1, percent: 0 },
      ],
    });
  });

  it('computes average and breakdown from reviews', () => {
    const summary = deriveReviewsSummary([
      { rating: 5 },
      { rating: 5 },
      { rating: 4 },
    ]);
    expect(summary.reviewCount).toBe(3);
    expect(summary.averageRating).toBe(4.7);
    expect(summary.breakdown.find(r => r.stars === 5)?.percent).toBe(67);
  });
});
