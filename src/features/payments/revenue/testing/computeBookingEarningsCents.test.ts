import { describe, expect, it } from 'vitest';
import { computeBookingEarningsCents } from '../computeBookingEarningsCents';

describe('computeBookingEarningsCents', () => {
  it('counts a completed job at full price when the payment row is empty', () => {
    const result = computeBookingEarningsCents({
      status: 'completed',
      scheduled_date: '2026-08-26',
      subtotal_cents: 15000,
      discount_cents: 0,
      booking_payments: {
        total_amount_cents: null,
        session_payment_amount_cents: 0,
        paid_online_amount_cents: 0,
        session_fees_total_cents: 0,
      },
    });
    expect(result).toEqual({
      collectedCents: 15000,
      potentialCents: 15000,
      scheduledYmd: '2026-08-26',
    });
  });

  it('skips jobs that are not completed', () => {
    expect(
      computeBookingEarningsCents({
        status: 'confirmed',
        scheduled_date: '2026-08-26',
        subtotal_cents: 15000,
      })
    ).toBeNull();
  });

  it('uses the scheduled calendar day, not payment time', () => {
    const result = computeBookingEarningsCents({
      status: 'completed',
      scheduled_date: '2026-08-26T00:00:00.000Z',
      subtotal_cents: 20000,
    });
    expect(result?.scheduledYmd).toBe('2026-08-26');
  });
});
