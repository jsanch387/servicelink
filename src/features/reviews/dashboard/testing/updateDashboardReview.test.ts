import { describe, expect, it, vi } from 'vitest';
import { updateDashboardReview } from '../server/updateDashboardReview';

function createMockSupabase(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ maybeSingle });
  const eqBusiness = vi.fn().mockReturnValue({ select });
  const eqId = vi.fn().mockReturnValue({ eq: eqBusiness });
  const update = vi.fn().mockReturnValue({ eq: eqId });
  const from = vi.fn().mockReturnValue({ update });
  return { from, update, eqId, eqBusiness, select, maybeSingle };
}

const sampleRow = {
  id: 'rev-1',
  author_display_name: 'Alex Rivera',
  rating: 5,
  body: 'Great work.',
  created_at: '2025-06-10T15:00:00.000Z',
  owner_reply_body: 'Thanks for trusting us!',
  owner_replied_at: '2025-06-11T10:00:00.000Z',
  is_hidden: false,
};

describe('updateDashboardReview', () => {
  it('returns 400 for blank ids', async () => {
    const supabase = createMockSupabase({ data: null, error: null });
    const result = await updateDashboardReview(supabase as never, '  ', '  ', {
      ownerReplyBody: 'x',
    });
    expect(result).toEqual({
      ok: false,
      status: 400,
      error: 'businessId and reviewId are required',
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('saves reply body with replied_at timestamp', async () => {
    const supabase = createMockSupabase({ data: sampleRow, error: null });
    const result = await updateDashboardReview(
      supabase as never,
      'biz-1',
      'rev-1',
      { ownerReplyBody: 'Thanks for trusting us!' }
    );
    expect(result.ok).toBe(true);
    expect(supabase.update).toHaveBeenCalled();
    const updateArg = supabase.update.mock.calls[0]?.[0] as {
      owner_reply_body: string | null;
      owner_replied_at: string | null;
    };
    expect(updateArg.owner_reply_body).toBe('Thanks for trusting us!');
    expect(updateArg.owner_replied_at).toBeTruthy();
    expect(supabase.eqId).toHaveBeenCalledWith('id', 'rev-1');
    expect(supabase.eqBusiness).toHaveBeenCalledWith('business_id', 'biz-1');
  });

  it('clears both reply fields when ownerReplyBody is null', async () => {
    const supabase = createMockSupabase({
      data: {
        ...sampleRow,
        owner_reply_body: null,
        owner_replied_at: null,
      },
      error: null,
    });
    const result = await updateDashboardReview(
      supabase as never,
      'biz-1',
      'rev-1',
      { ownerReplyBody: null }
    );
    expect(result.ok).toBe(true);
    expect(supabase.update).toHaveBeenCalledWith({
      owner_reply_body: null,
      owner_replied_at: null,
    });
  });

  it('returns 404 when review is not found', async () => {
    const supabase = createMockSupabase({ data: null, error: null });
    const result = await updateDashboardReview(
      supabase as never,
      'biz-1',
      'rev-404',
      { ownerReplyBody: 'hello' }
    );
    expect(result).toEqual({
      ok: false,
      status: 404,
      error: 'Review not found',
    });
  });
});
