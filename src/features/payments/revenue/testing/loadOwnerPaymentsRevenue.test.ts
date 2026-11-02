import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mockAuth = vi.fn();
const mockRateLimit = vi.fn();
const mockCompleted = vi.fn();

vi.mock(
  '@/features/availability/booking/server/resolveTapToPayRouteAuth',
  () => ({
    resolveTapToPayRouteAuth: (...args: unknown[]) => mockAuth(...args),
  })
);

vi.mock('@/server/rateLimit/ownerPaymentsTransactionsRateLimit', () => ({
  assertOwnerPaymentsTransactionsRateLimits: (...args: unknown[]) =>
    mockRateLimit(...args),
}));

vi.mock('../loadCompletedBookingPayments', () => ({
  loadCompletedBookingPayments: (...args: unknown[]) => mockCompleted(...args),
}));

import { loadOwnerPaymentsRevenue } from '../loadOwnerPaymentsRevenue';

function makeRequest(query = 'period=week&timeZone=UTC'): NextRequest {
  return {
    nextUrl: { searchParams: new URLSearchParams(query) },
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe('loadOwnerPaymentsRevenue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      ok: true,
      user: { id: 'user_1' },
      supabase: {},
      business: { id: 'biz_1', business_name: 'Acme' },
    });
    mockRateLimit.mockResolvedValue({ ok: true });
    mockCompleted.mockResolvedValue({ ok: true, rows: [] });
  });

  it('sums completed jobs on the scheduled day', async () => {
    mockCompleted.mockResolvedValue({
      ok: true,
      rows: [
        {
          status: 'completed',
          scheduled_date: '2026-08-26',
          subtotal_cents: 15000,
        },
      ],
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T18:00:00.000Z'));
    const result = await loadOwnerPaymentsRevenue(makeRequest());
    vi.useRealTimers();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.totalCents).toBe(15000);
    expect(result.jobsPaid).toBe(1);
    expect(result.bucketKind).toBe('daily');
  });

  it('fails when completed bookings cannot be loaded', async () => {
    mockCompleted.mockResolvedValue({ ok: false });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T18:00:00.000Z'));
    const result = await loadOwnerPaymentsRevenue(makeRequest());
    vi.useRealTimers();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.httpStatus).toBe(502);
  });
});
