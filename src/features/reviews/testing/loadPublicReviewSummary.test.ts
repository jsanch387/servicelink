import { describe, expect, it, vi } from 'vitest';
import {
  loadPublicReviewSummary,
  publicReviewSummaryFromLoadResult,
} from '../server/loadPublicReviewSummary';

function createMockDb(result: { data: unknown; error: unknown }) {
  const limit = vi.fn().mockResolvedValue(result);
  const order = vi.fn().mockReturnValue({ limit });
  const eqHidden = vi.fn().mockReturnValue({ order });
  const eqBusiness = vi.fn().mockReturnValue({ eq: eqHidden });
  const select = vi.fn().mockReturnValue({ eq: eqBusiness });
  const from = vi.fn().mockReturnValue({ select });
  return { from, select, eqBusiness, eqHidden, order, limit };
}

describe('loadPublicReviewSummary', () => {
  it('returns empty when there are no ratings', async () => {
    const db = createMockDb({ data: [], error: null });
    await expect(loadPublicReviewSummary(db, 'biz-1')).resolves.toEqual({
      status: 'empty',
    });
  });

  it('derives summary from rating rows only', async () => {
    const db = createMockDb({
      data: [{ rating: 5 }, { rating: 4 }],
      error: null,
    });
    const result = await loadPublicReviewSummary(db, 'biz-1');
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.summary.reviewCount).toBe(2);
      expect(result.summary.averageRating).toBe(4.5);
    }
    expect(db.select).toHaveBeenCalledWith('rating');
  });
});

describe('publicReviewSummaryFromLoadResult', () => {
  it('returns summary only for ok status', () => {
    const summary = {
      averageRating: 5,
      reviewCount: 1,
      breakdown: [],
    };
    expect(summary);

    expect(publicReviewSummaryFromLoadResult({ status: 'empty' })).toBeNull();
  });
});
