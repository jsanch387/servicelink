import { describe, expect, it } from 'vitest';
import { computeRatingBreakdown } from '../server/computeRatingBreakdown';

describe('computeRatingBreakdown', () => {
  it('returns all zeros when there are no ratings', () => {
    expect(computeRatingBreakdown([])).toEqual([
      { stars: 5, percent: 0 },
      { stars: 4, percent: 0 },
      { stars: 3, percent: 0 },
      { stars: 2, percent: 0 },
      { stars: 1, percent: 0 },
    ]);
  });

  it('puts 100% on the 5-star row when all ratings are 5', () => {
    expect(computeRatingBreakdown([5, 5, 5])).toEqual([
      { stars: 5, percent: 100 },
      { stars: 4, percent: 0 },
      { stars: 3, percent: 0 },
      { stars: 2, percent: 0 },
      { stars: 1, percent: 0 },
    ]);
  });

  it('distributes mixed ratings with rounded percents', () => {
    const breakdown = computeRatingBreakdown([5, 5, 4]);
    expect(breakdown.find(r => r.stars === 5)?.percent).toBe(67);
    expect(breakdown.find(r => r.stars === 4)?.percent).toBe(33);
  });

  it('ignores out-of-range ratings when bucketing', () => {
    const breakdown = computeRatingBreakdown([5, 0, 6]);
    expect(breakdown.find(r => r.stars === 5)?.percent).toBe(33);
  });
});
