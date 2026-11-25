import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadCompletedBookingPaymentsMock = vi.fn();
const createSupabaseAdminClientMock = vi.fn(() => ({ admin: true }));

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: () => createSupabaseAdminClientMock(),
}));

vi.mock('@/features/payments/revenue/loadCompletedBookingPayments', () => ({
  loadCompletedBookingPayments: (...args: unknown[]) =>
    loadCompletedBookingPaymentsMock(...args),
}));

import { executeGetRevenue } from '../tools/read/getRevenue';

describe('executeGetRevenue', () => {
  beforeEach(() => {
    loadCompletedBookingPaymentsMock.mockReset();
    createSupabaseAdminClientMock.mockClear();
  });

  it('returns last month totals and top services for the shop', async () => {
    loadCompletedBookingPaymentsMock.mockResolvedValue({
      ok: true,
      rows: [
        {
          status: 'completed',
          scheduled_date: '2026-10-05',
          service_name: 'Full detail',
          service_price_cents: 25000,
          addon_details: [],
          job_details: null,
          subtotal_cents: 25000,
          discount_cents: 0,
          booking_payments: { total_amount_cents: 25000 },
        },
        {
          status: 'completed',
          scheduled_date: '2026-10-20',
          service_name: 'Exterior',
          service_price_cents: 10000,
          addon_details: [],
          job_details: null,
          subtotal_cents: 10000,
          discount_cents: 0,
          booking_payments: { total_amount_cents: 10000 },
        },
        {
          status: 'completed',
          scheduled_date: '2026-09-15',
          service_name: 'Full detail',
          service_price_cents: 20000,
          addon_details: [],
          job_details: null,
          subtotal_cents: 20000,
          discount_cents: 0,
          booking_payments: { total_amount_cents: 20000 },
        },
      ],
    });

    const result = await executeGetRevenue({
      businessId: 'biz-1',
      period: 'last_month',
      timeZone: 'UTC',
      now: new Date('2026-11-15T15:00:00.000Z'),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.fromYmd).toBe('2026-10-01');
    expect(result.toYmd).toBe('2026-10-31');
    expect(result.collectedCents).toBe(35000);
    expect(result.collectedLabel).toBe('$350');
    expect(result.jobCount).toBe(2);
    expect(result.previousCollectedCents).toBe(20000);
    expect(result.byService[0]?.serviceName).toBe('Full detail');
    expect(loadCompletedBookingPaymentsMock).toHaveBeenCalledWith(
      { admin: true },
      {
        businessId: 'biz-1',
        fromYmd: '2026-09-01',
        toYmd: '2026-10-31',
      }
    );
  });
});
