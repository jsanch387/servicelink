import { describe, expect, it } from 'vitest';
import { aggregatePaymentsRevenue } from '../aggregatePaymentsRevenue';
import type { RevenueRange } from '../resolveRevenueRange';

const week: RevenueRange = {
  period: 'week',
  timeZone: 'UTC',
  fromYmd: '2026-08-24',
  toYmd: '2026-08-30',
  previousFromYmd: '2026-08-17',
  previousToYmd: '2026-08-23',
  comparePrevious: true,
  unbounded: false,
  bucketKind: 'daily',
};

describe('aggregatePaymentsRevenue', () => {
  it('puts a completed job on the scheduled weekday and keeps seven bars', () => {
    const result = aggregatePaymentsRevenue({
      todayYmd: '2026-08-29',
      range: week,
      rows: [
        {
          status: 'completed',
          scheduled_date: '2026-08-26',
          subtotal_cents: 15000,
        },
        {
          status: 'confirmed',
          scheduled_date: '2026-08-26',
          subtotal_cents: 9000,
        },
      ],
    });

    expect(result.collectedCents).toBe(15000);
    expect(result.jobsPaid).toBe(1);
    expect(result.buckets).toHaveLength(7);
    expect(result.buckets.map(bar => bar.label)).toEqual([
      'Mo',
      'Tu',
      'We',
      'Th',
      'Fr',
      'Sa',
      'Su',
    ]);
    expect(result.buckets[2]?.totalCents).toBe(15000);
    expect(result.buckets[2]?.hoverLabel).toBe('Wed, Aug 26');
  });

  it('builds four in-month week segments', () => {
    const result = aggregatePaymentsRevenue({
      todayYmd: '2026-08-29',
      range: {
        ...week,
        period: 'month',
        fromYmd: '2026-08-01',
        toYmd: '2026-08-31',
        previousFromYmd: '2026-07-01',
        previousToYmd: '2026-07-31',
        bucketKind: 'weekly',
      },
      rows: [
        {
          status: 'completed',
          scheduled_date: '2026-08-26',
          subtotal_cents: 15000,
        },
      ],
    });

    expect(result.buckets.map(bar => bar.label)).toEqual([
      'Wk 1',
      'Wk 2',
      'Wk 3',
      'Wk 4',
    ]);
    expect(result.buckets[3]?.totalCents).toBe(15000);
  });

  it('keeps a month-long custom range daily instead of anonymous weeks', () => {
    const result = aggregatePaymentsRevenue({
      todayYmd: '2026-08-29',
      range: {
        ...week,
        period: 'custom',
        fromYmd: '2026-07-15',
        toYmd: '2026-08-15',
        previousFromYmd: '2026-06-13',
        previousToYmd: '2026-07-14',
        bucketKind: 'daily',
      },
      rows: [
        {
          status: 'completed',
          scheduled_date: '2026-07-20',
          subtotal_cents: 8000,
        },
      ],
    });

    expect(result.buckets).toHaveLength(32);
    expect(result.buckets[0]?.label).toBe('Jul 15');
    expect(result.buckets[31]?.label).toBe('Aug 15');
    expect(result.buckets[5]?.totalCents).toBe(8000);
  });

  it('labels longer custom week chunks by start date', () => {
    const result = aggregatePaymentsRevenue({
      todayYmd: '2026-08-29',
      range: {
        ...week,
        period: 'custom',
        fromYmd: '2026-05-01',
        toYmd: '2026-08-15',
        previousFromYmd: '2026-01-15',
        previousToYmd: '2026-04-30',
        bucketKind: 'weekly',
      },
      rows: [],
    });

    expect(result.buckets[0]?.label).toBe('May 1');
    expect(result.buckets[0]?.hoverLabel).toBe('May 1 – May 7');
  });

  it('treats $0 → positive as +100%', () => {
    const result = aggregatePaymentsRevenue({
      todayYmd: '2026-08-29',
      range: week,
      rows: [
        {
          status: 'completed',
          scheduled_date: '2026-08-26',
          subtotal_cents: 15000,
        },
      ],
    });
    expect(result.changePercent).toBe(100);
  });
});
