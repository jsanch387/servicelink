import { describe, expect, it, vi } from 'vitest';
import { loadPublicReviewFeed } from '../server/loadPublicReviewFeed';

function createFeedDb(tables: Record<string, unknown[]>) {
  return {
    from: vi.fn((table: string) => {
      const limit = vi.fn().mockResolvedValue({
        data: tables[table] ?? [],
        error: null,
      });
      const order = vi.fn().mockReturnValue({ limit });
      const eqHidden = vi.fn().mockReturnValue({ order });
      const eqBusiness = vi.fn().mockReturnValue(
        table === 'reviews' ? { eq: eqHidden } : { order }
      );
      return {
        select: vi.fn().mockReturnValue({ eq: eqBusiness }),
      };
    }),
  };
}

describe('loadPublicReviewFeed', () => {
  it('merges both sources newest first and pages them', async () => {
    const db = createFeedDb({
      reviews: [
        {
          id: 'sl-1',
          author_display_name: 'Ana',
          rating: 5,
          body: 'Great',
          created_at: '2026-03-01T00:00:00.000Z',
          owner_reply_body: null,
          owner_replied_at: null,
        },
      ],
      google_reviews: [
        {
          id: 'g-1',
          author_display_name: 'Ben',
          rating: 4,
          body: 'Good',
          provider_create_time: '2026-04-01T00:00:00.000Z',
          owner_reply_body: null,
          owner_replied_at: null,
        },
      ],
    });

    const result = await loadPublicReviewFeed(db, 'biz-1', {
      offset: 0,
      limit: 10,
    });

    expect(result).toEqual({
      ok: true,
      hasMore: false,
      reviews: [
        expect.objectContaining({
          id: 'google:g-1',
          source: 'google',
          createdAt: '2026-04-01T00:00:00.000Z',
        }),
        expect.objectContaining({
          id: 'sl-1',
          createdAt: '2026-03-01T00:00:00.000Z',
        }),
      ],
    });
  });
});
