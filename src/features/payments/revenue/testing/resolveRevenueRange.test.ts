import { describe, expect, it } from 'vitest';
import { resolveRevenueRange } from '../resolveRevenueRange';

describe('resolveRevenueRange', () => {
  const now = new Date('2026-08-29T18:00:00.000Z');

  it('uses the Monday–Sunday week that contains today', () => {
    const result = resolveRevenueRange({
      period: 'week',
      now,
      timeZone: 'UTC',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.range.fromYmd).toBe('2026-08-24');
    expect(result.range.toYmd).toBe('2026-08-30');
    expect(result.range.previousFromYmd).toBe('2026-08-17');
    expect(result.range.previousToYmd).toBe('2026-08-23');
    expect(result.range.bucketKind).toBe('daily');
  });

  it('uses the calendar month and last calendar month', () => {
    const result = resolveRevenueRange({
      period: 'month',
      now,
      timeZone: 'UTC',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.range.fromYmd).toBe('2026-08-01');
    expect(result.range.toYmd).toBe('2026-08-31');
    expect(result.range.previousFromYmd).toBe('2026-07-01');
    expect(result.range.previousToYmd).toBe('2026-07-31');
    expect(result.range.bucketKind).toBe('weekly');
  });

  it('uses the full calendar year', () => {
    const result = resolveRevenueRange({
      period: 'year',
      now,
      timeZone: 'UTC',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.range.fromYmd).toBe('2026-01-01');
    expect(result.range.toYmd).toBe('2026-12-31');
    expect(result.range.previousFromYmd).toBe('2025-01-01');
    expect(result.range.previousToYmd).toBe('2025-12-31');
    expect(result.range.bucketKind).toBe('monthly');
  });

  it('marks all time unbounded with no prior window', () => {
    const result = resolveRevenueRange({
      period: 'all',
      now,
      timeZone: 'UTC',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.range.unbounded).toBe(true);
    expect(result.range.comparePrevious).toBe(false);
    expect(result.range.bucketKind).toBe('yearly');
  });

  it('keeps a future custom end and compares the equal-length prior range', () => {
    const result = resolveRevenueRange({
      period: 'custom',
      now,
      timeZone: 'UTC',
      customFrom: '2026-08-10',
      customTo: '2026-08-20',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.range.fromYmd).toBe('2026-08-10');
    expect(result.range.toYmd).toBe('2026-08-20');
    expect(result.range.previousFromYmd).toBe('2026-07-30');
    expect(result.range.previousToYmd).toBe('2026-08-09');
  });

  it('keeps a Jul 15–Aug 15 custom range on daily bars', () => {
    const result = resolveRevenueRange({
      period: 'custom',
      now,
      timeZone: 'UTC',
      customFrom: '2026-07-15',
      customTo: '2026-08-15',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.range.bucketKind).toBe('daily');
  });
});
