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
      taxCollectedCents: 0,
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

  it('keeps sales tax out of earnings and reports it beside the job', () => {
    const result = computeBookingEarningsCents({
      status: 'completed',
      scheduled_date: '2026-10-27',
      subtotal_cents: 8500,
      booking_payments: {
        total_amount_cents: 8691,
        paid_online_amount_cents: 8691,
        tax_cents: 191,
      },
    });
    expect(result).toEqual({
      collectedCents: 8500,
      potentialCents: 8500,
      taxCollectedCents: 191,
      scheduledYmd: '2026-10-27',
    });
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
