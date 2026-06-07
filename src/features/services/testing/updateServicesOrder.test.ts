import { updateServicesOrder } from '@/features/services/api/updateServicesOrder';
import { describe, expect, it, vi } from 'vitest';

describe('updateServicesOrder', () => {
  it('sets sort_order to index * 10 for each service id in the bucket', async () => {
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

    const result = await updateServicesOrder(supabase, 'biz-1', [
      'svc-b',
      'svc-a',
    ]);

    expect(result).toEqual({ success: true, error: null });
    expect(supabase.from).toHaveBeenCalledWith('business_services');
    expect(payloads).toEqual([
      { sort_order: 0, updated_at: expect.any(String) },
      { sort_order: 10, updated_at: expect.any(String) },
    ]);
    expect(eqId).toHaveBeenNthCalledWith(1, 'id', 'svc-b');
    expect(eqId).toHaveBeenNthCalledWith(2, 'id', 'svc-a');
    expect(eqBusiness).toHaveBeenCalledWith('business_id', 'biz-1');
  });

  it('returns an error when Supabase update fails', async () => {
    const eqBusiness = vi
      .fn()
      .mockResolvedValue({ error: { message: 'permission denied' } });
    const eqId = vi.fn(() => ({ eq: eqBusiness }));
    const update = vi.fn(() => ({ eq: eqId }));
    const supabase = {
      from: vi.fn(() => ({ update })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const result = await updateServicesOrder(supabase, 'biz-1', ['svc-a']);

    expect(result).toEqual({
      success: false,
      error: 'permission denied',
    });
  });
});
