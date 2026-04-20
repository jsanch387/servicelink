import { getHasProAccessForPayments } from '@/features/payments/server/getHasProAccessForPayments';
import { describe, expect, it, vi } from 'vitest';

function mockSupabaseProfileRow(row: Record<string, unknown> | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return {
    supabase: {
      from,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    select,
    eq,
  };
}

describe('[Payments] getHasProAccessForPayments', () => {
  it('keeps lifetime pro users as pro without Stripe ids', async () => {
    const { supabase } = mockSupabaseProfileRow({
      subscription_tier: 'pro',
      subscription_current_period_end: null,
      subscription_status: null,
      stripe_subscription_id: null,
      stripe_customer_id: null,
    });

    const result = await getHasProAccessForPayments(supabase, 'user-1');

    expect(result).toBe(true);
  });

  it('revokes pro when Stripe billing status is past_due', async () => {
    const { supabase } = mockSupabaseProfileRow({
      subscription_tier: 'pro',
      subscription_current_period_end: '2026-12-01T00:00:00.000Z',
      subscription_status: 'past_due',
      stripe_subscription_id: 'sub_123',
      stripe_customer_id: 'cus_123',
    });

    const result = await getHasProAccessForPayments(supabase, 'user-2');

    expect(result).toBe(false);
  });

  it('revokes stale pro rows for former subscribers without active sub id', async () => {
    const { supabase } = mockSupabaseProfileRow({
      subscription_tier: 'pro',
      subscription_current_period_end: null,
      subscription_status: null,
      stripe_subscription_id: null,
      stripe_customer_id: 'cus_legacy',
    });

    const result = await getHasProAccessForPayments(supabase, 'user-3');

    expect(result).toBe(false);
  });
});
