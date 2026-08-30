import { describe, expect, it } from 'vitest';
import {
  bucketRevenueEvents,
  formatBucketHoverLabel,
  formatBucketLabel,
  revenueChangePercent,
  revenueSourceTotals,
  sumRevenueCents,
} from '../summarizeRevenue';

describe('summarizeRevenue', () => {
  it('fills empty days and sums cash plus card in the same bucket', () => {
    const buckets = bucketRevenueEvents(
      [
        {
          createdAt: '2026-08-22T15:00:00.000Z',
          amountCents: 4000,
          source: 'cash',
        },
        {
          createdAt: '2026-08-22T18:00:00.000Z',
          amountCents: 2500,
          source: 'booking',
        },
        {
          createdAt: '2026-08-23T12:00:00.000Z',
          amountCents: -500,
          source: 'booking',
        },
      ],
      {
        fromYmd: '2026-08-22',
        toYmd: '2026-08-24',
        timeZone: 'UTC',
        bucket: 'day',
        fromIso: '2026-08-22T00:00:00.000Z',
        toIso: '2026-08-24T23:59:59.999Z',
      }
    );

    expect(buckets.map(bucket => bucket.totalCents)).toEqual([6500, -500, 0]);
    expect(buckets[0]?.hoverLabel).toBe('Sat, Aug 22');
  });

  it('formats hover dates as weekday plus month and day', () => {
    expect(formatBucketHoverLabel('2026-08-24', 'day')).toBe('Mon, Aug 24');
    expect(formatBucketHoverLabel('2026-08', 'month')).toBe('Aug 2026');
  });

  it('uses Today and Yesterday on a week chart', () => {
    const options = { todayYmd: '2026-08-29', weekdayTicks: true };
    expect(formatBucketLabel('2026-08-29', 'day', options)).toBe('Today');
    expect(formatBucketLabel('2026-08-28', 'day', options)).toBe('Yesterday');
    expect(formatBucketLabel('2026-08-24', 'day', options)).toBe('Mon');
    expect(formatBucketHoverLabel('2026-08-29', 'day', options)).toBe(
      'Today, Aug 29'
    );
    expect(formatBucketHoverLabel('2026-08-28', 'day', options)).toBe(
      'Yesterday, Aug 28'
    );
    expect(formatBucketHoverLabel('2026-08-24', 'day', options)).toBe(
      'Mon, Aug 24'
    );
  });

  it('groups sources and skips payouts', () => {
    const sources = revenueSourceTotals([
      { createdAt: 'x', amountCents: 1000, source: 'cash' },
      { createdAt: 'x', amountCents: 400, source: 'payment_app' },
      { createdAt: 'x', amountCents: 200, source: 'cash' },
      { createdAt: 'x', amountCents: 8000, source: 'payout' },
    ]);
    expect(sources).toEqual([
      { source: 'cash', label: 'Cash', cents: 1200 },
      { source: 'payment_app', label: 'Payment app', cents: 400 },
    ]);
  });

  it('computes a percent change against the previous window', () => {
    expect(revenueChangePercent(1500, 1000)).toBe(50);
    expect(revenueChangePercent(0, 0)).toBeNull();
    expect(revenueChangePercent(500, 0)).toBe(100);
    expect(
      sumRevenueCents([{ createdAt: 'x', amountCents: 200, source: 'other' }])
    ).toBe(200);
  });
});
