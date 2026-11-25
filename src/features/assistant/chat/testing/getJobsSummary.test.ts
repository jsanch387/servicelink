import { beforeEach, describe, expect, it, vi } from 'vitest';

const orderMock = vi.fn();
const limitMock = vi.fn();

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => ({
            lte: () => ({
              order: (...args: unknown[]) => {
                orderMock(...args);
                return {
                  order: () => ({
                    limit: (n: number) => {
                      limitMock(n);
                      return Promise.resolve({
                        data: [
                          {
                            id: '1',
                            status: 'confirmed',
                            scheduled_date: '2026-11-24',
                            start_time: '09:00',
                            customer_name: 'Jordan',
                            service_name: 'Full detail',
                          },
                          {
                            id: '2',
                            status: 'completed',
                            scheduled_date: '2026-11-24',
                            start_time: '11:00',
                            customer_name: 'Sam',
                            service_name: 'Wash',
                          },
                        ],
                        error: null,
                      });
                    },
                  }),
                };
              },
            }),
          }),
        }),
      }),
    }),
  }),
}));

import { executeGetJobsSummary } from '../tools/read/getJobsSummary';

describe('executeGetJobsSummary', () => {
  beforeEach(() => {
    orderMock.mockClear();
    limitMock.mockClear();
  });

  it('summarizes today with upcoming confirmed jobs', async () => {
    const result = await executeGetJobsSummary({
      businessId: 'biz-1',
      range: 'today',
      now: new Date('2026-11-24T15:00:00.000Z'),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fromYmd).toBe('2026-11-24');
    expect(result.confirmedCount).toBe(1);
    expect(result.completedCount).toBe(1);
    expect(result.upcoming[0]?.customerName).toBe('Jordan');
  });
});
