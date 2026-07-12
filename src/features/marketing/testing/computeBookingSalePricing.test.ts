import { describe, expect, it } from 'vitest';
import { computeBookingSalePricing } from '../utils/computeBookingSalePricing';
import {
  formatServiceDateYmd,
  isServiceDateInSaleWindow,
} from '../utils/isServiceDateInSaleWindow';

describe('formatServiceDateYmd', () => {
  it('formats local calendar date as YYYY-MM-DD', () => {
    expect(formatServiceDateYmd(new Date(2026, 6, 8))).toBe('2026-07-08');
  });
});

describe('isServiceDateInSaleWindow', () => {
  const sale = {
    startsAt: new Date('2026-07-01T00:00:00.000Z'),
    endsAt: new Date('2026-07-31T23:59:59.999Z'),
  };

  it('returns true when service date is within the window', () => {
    expect(isServiceDateInSaleWindow(sale, '2026-07-15')).toBe(true);
  });

  it('returns false before the sale starts', () => {
    expect(isServiceDateInSaleWindow(sale, '2026-06-30')).toBe(false);
  });

  it('returns false after the sale ends', () => {
    expect(isServiceDateInSaleWindow(sale, '2026-08-01')).toBe(false);
  });

  it('returns false for invalid date strings', () => {
    expect(isServiceDateInSaleWindow(sale, 'not-a-date')).toBe(false);
  });

  it('allows open-ended sales when bounds are missing', () => {
    expect(isServiceDateInSaleWindow({}, '2026-07-15')).toBe(true);
  });
});

describe('computeBookingSalePricing', () => {
  const sale = {
    name: 'Summer Sale',
    discountType: 'percentage' as const,
    discountValue: 35,
    startsAt: new Date('2026-07-01T00:00:00.000Z'),
    endsAt: new Date('2026-07-31T23:59:59.999Z'),
  };

  it('returns no discount when appointment date is outside the sale window', () => {
    expect(computeBookingSalePricing(10000, sale, '2026-08-01')).toEqual({
      subtotalCents: 10000,
      discountCents: 0,
      estimatedTotalCents: 10000,
      saleApplies: false,
    });
  });

  it('applies sale discount when appointment date qualifies', () => {
    expect(computeBookingSalePricing(10000, sale, '2026-07-15')).toEqual({
      subtotalCents: 10000,
      discountCents: 3500,
      estimatedTotalCents: 6500,
      saleApplies: true,
    });
  });

  it('returns no discount when no date is selected yet', () => {
    expect(computeBookingSalePricing(10000, sale, null)).toEqual({
      subtotalCents: 10000,
      discountCents: 0,
      estimatedTotalCents: 10000,
      saleApplies: false,
    });
  });
});
