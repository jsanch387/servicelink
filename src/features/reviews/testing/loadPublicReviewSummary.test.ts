import { describe, expect, it, vi } from 'vitest';
import {
  loadPublicReviewSummary,
  publicReviewSummaryFromLoadResult,
} from '../server/loadPublicReviewSummary';

function createCountDb(counts: Partial<Record<number, number>>) {
  const from = vi.fn().mockImplementation(() => {
    const eq = vi.fn().mockImplementation((column: string, value: unknown) => {
      if (column === 'rating') {
        return Promise.resolve({
          count: counts[Number(value)] ?? 0,
          error: null,
        });
      }
      return { eq };
    });
    return {
      select: vi.fn().mockReturnValue({ eq }),
    };
  });
  return { from };
}

describe('loadPublicReviewSummary', () => {
  it('returns empty when there are no ratings', async () => {
    const db = createCountDb({});
    await expect(loadPublicReviewSummary(db, 'biz-1')).resolves.toEqual({
      status: 'empty',
    });
  });

  it('derives the score from every star count, not a recent page', async () => {
    const db = createCountDb({ 5: 3, 4: 1 });
    const result = await loadPublicReviewSummary(db, 'biz-1');
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.summary.reviewCount).toBe(4);
      expect(result.summary.averageRating).toBe(4.8);
      expect(result.summary.breakdown[0]).toEqual({ stars: 5, percent: 75 });
    }
    expect(db.from).toHaveBeenCalledWith('reviews');
  });
});

describe('publicReviewSummaryFromLoadResult', () => {
  it('returns summary only for ok status', () => {
    expect(publicReviewSummaryFromLoadResult({ status: 'empty' })).toBeNull();
  });
});
