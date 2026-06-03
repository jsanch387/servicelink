import { describe, expect, it, vi } from 'vitest';
import {
  loadPublicBusinessReviews,
  publicReviewsDataFromLoadResult,
} from '../server/loadPublicBusinessReviews';

function createMockDb(result: { data: unknown; error: unknown }) {
  const limit = vi.fn().mockResolvedValue(result);
  const order = vi.fn().mockReturnValue({ limit });
  const eqHidden = vi.fn().mockReturnValue({ order });
  const eqBusiness = vi.fn().mockReturnValue({ eq: eqHidden });
  const select = vi.fn().mockReturnValue({ eq: eqBusiness });
  const from = vi.fn().mockReturnValue({ select });
  return { from, select, eqBusiness, eqHidden, order, limit };
}

const sampleRow = {
  id: 'rev-1',
  author_display_name: 'Alex Rivera',
  rating: 5,
  body: 'Great work.',
  created_at: '2025-06-10T15:00:00.000Z',
  owner_reply_body: null,
  owner_replied_at: null,
};

describe('loadPublicBusinessReviews', () => {
  it('returns error status on query failure', async () => {
    const db = createMockDb({ data: null, error: { message: 'fail' } });
    await expect(loadPublicBusinessReviews(db, 'biz-1')).resolves.toEqual({
      status: 'error',
      message: 'fail',
    });
  });

  it('returns empty status when there are no visible reviews', async () => {
    const db = createMockDb({ data: [], error: null });
    await expect(loadPublicBusinessReviews(db, 'biz-1')).resolves.toEqual({
      status: 'empty',
    });
  });

  it('returns error for blank business id', async () => {
    const db = createMockDb({ data: [], error: null });
    await expect(loadPublicBusinessReviews(db, '  ')).resolves.toEqual({
      status: 'error',
      message: 'businessId is required',
    });
    expect(db.from).not.toHaveBeenCalled();
  });

  it('maps rows and derives summary', async () => {
    const db = createMockDb({ data: [sampleRow], error: null });
    const result = await loadPublicBusinessReviews(db, 'biz-1');

    expect(result).toEqual({
      status: 'ok',
      data: {
        reviews: [
          {
            id: 'rev-1',
            authorDisplayName: 'Alex Rivera',
            rating: 5,
            body: 'Great work.',
            createdAt: '2025-06-10T15:00:00.000Z',
            ownerReply: undefined,
          },
        ],
        summary: {
          averageRating: 5,
          reviewCount: 1,
          breakdown: [
            { stars: 5, percent: 100 },
            { stars: 4, percent: 0 },
            { stars: 3, percent: 0 },
            { stars: 2, percent: 0 },
            { stars: 1, percent: 0 },
          ],
        },
      },
    });

    expect(db.from).toHaveBeenCalledWith('reviews');
    expect(db.eqBusiness).toHaveBeenCalledWith('business_id', 'biz-1');
    expect(db.eqHidden).toHaveBeenCalledWith('is_hidden', false);
  });

  it('skips invalid rows and returns empty when none are valid', async () => {
    const db = createMockDb({
      data: [
        ,
        ,
        {
          id: '',
          author_display_name: 'X',
          rating: 5,
          body: 'x',
          created_at: '2025-01-01',
        },
      ],
      error: null,
    });
    await expect(loadPublicBusinessReviews(db, 'biz-1')).resolves.toEqual({
      status: 'empty',
    });
  });
});

describe('publicReviewsDataFromLoadResult', () => {
  it('returns data only for ok status', () => {
    const ok = {
      status: 'ok' as const,
      data: {
        reviews: [],
        summary: {
          averageRating: 0,
          reviewCount: 0,
          breakdown: [],
        },
      },
    };
    expect(publicReviewsDataFromLoadResult(ok)).toBe(ok.data);
    expect(publicReviewsDataFromLoadResult({ status: 'empty' })).toBeNull();
    expect(
      publicReviewsDataFromLoadResult({ status: 'error', message: 'x' })
    ).toBeNull();
  });
});
