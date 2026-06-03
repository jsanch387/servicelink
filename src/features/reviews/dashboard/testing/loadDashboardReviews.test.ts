import { describe, expect, it, vi } from 'vitest';
import { loadDashboardReviews } from '../server/loadDashboardReviews';

function createMockSupabase(result: { data: unknown; error: unknown }) {
  const limit = vi.fn().mockResolvedValue(result);
  const order = vi.fn().mockReturnValue({ limit });
  const eq = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from, select, eq, order, limit };
}

const sampleRow = {
  id: 'rev-1',
  author_display_name: 'Alex Rivera',
  rating: 5,
  body: 'Great work.',
  created_at: '2025-06-10T15:00:00.000Z',
  owner_reply_body: null,
  owner_replied_at: null,
  is_hidden: false,
};

describe('loadDashboardReviews', () => {
  it('returns 400 for blank business id', async () => {
    const supabase = createMockSupabase({ data: [], error: null });
    const result = await loadDashboardReviews(supabase as never, '  ');
    expect(result).toEqual({
      ok: false,
      status: 400,
      error: 'businessId is required',
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns error on query failure', async () => {
    const supabase = createMockSupabase({
      data: null,
      error: { message: 'db fail' },
    });
    const result = await loadDashboardReviews(supabase as never, 'biz-1');
    expect(result).toEqual({
      ok: false,
      status: 500,
      error: 'db fail',
    });
  });

  it('maps rows including hidden reviews', async () => {
    const supabase = createMockSupabase({
      data: [sampleRow, { ...sampleRow, id: 'rev-2', is_hidden: true }],
      error: null,
    });
    const result = await loadDashboardReviews(supabase as never, 'biz-1');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.reviews).toHaveLength(2);
      expect(result.reviews[0]?.isHidden).toBe(false);
      expect(result.reviews[1]?.isHidden).toBe(true);
    }

    expect(supabase.from).toHaveBeenCalledWith('reviews');
    expect(supabase.eq).toHaveBeenCalledWith('business_id', 'biz-1');
  });

  it('returns empty list when there are no reviews', async () => {
    const supabase = createMockSupabase({ data: [], error: null });
    const result = await loadDashboardReviews(supabase as never, 'biz-1');
    expect(result).toEqual({ ok: true, reviews: [] });
  });
});
