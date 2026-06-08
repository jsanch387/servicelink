import { updateServiceCategoriesOrder } from '../api/updateServiceCategoriesOrder';
import { describe, expect, it, vi } from 'vitest';

describe('updateServiceCategoriesOrder', () => {
  it('sets sort_order to index * 10 for each category id', async () => {
    const payloads: unknown[] = [];
    const eqBusiness = vi.fn().mockResolvedValue({ error: null });
    const eqId = vi.fn(() => ({ eq: eqBusiness }));
    const update = vi.fn((payload: unknown) => {
      payloads.push(payload);
      return { eq: eqId };
    });
    const supabase = {
      from: vi.fn(() => ({ update })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const result = await updateServiceCategoriesOrder(supabase, 'biz-1', [
      'cat-b',
      'cat-a',
    ]);

    expect(result).toEqual({ success: true, error: null });
    expect(supabase.from).toHaveBeenCalledWith('service_categories');
    expect(payloads).toEqual([
      { sort_order: 0, updated_at: expect.any(String) },
      { sort_order: 10, updated_at: expect.any(String) },
    ]);
    expect(eqId).toHaveBeenNthCalledWith(1, 'id', 'cat-b');
    expect(eqId).toHaveBeenNthCalledWith(2, 'id', 'cat-a');
    expect(eqBusiness).toHaveBeenCalledWith('business_id', 'biz-1');
  });

  it('returns an error when Supabase update fails', async () => {
    const eqBusiness = vi
      .fn()
      .mockResolvedValue({ error: { message: 'update failed' } });
    const eqId = vi.fn(() => ({ eq: eqBusiness }));
    const update = vi.fn(() => ({ eq: eqId }));
    const supabase = {
      from: vi.fn(() => ({ update })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const result = await updateServiceCategoriesOrder(supabase, 'biz-1', [
      'cat-a',
    ]);

    expect(result).toEqual({
      success: false,
      error: 'update failed',
    });
  });
});
