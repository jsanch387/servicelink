import { describe, expect, it } from 'vitest';
import { getPromoCodeStatus } from '../utils/getPromoCodeStatus';
import { getSaleStatus } from '../utils/getSaleStatus';
import { formatSaleDateRange } from '../utils/formatSaleDateRange';
import {
  compareMarketingCalendarDayToWindow,
  formatMarketingCalendarDate,
} from '../utils/marketingCalendarDate';
import type { PromoCode, Sale } from '../types';

const saleBase: Sale = {
  id: 'sale-1',
  name: 'Mobile Sale 2',
  discountType: 'fixed_amount',
  discountValue: 25,
  isActive: true,
  startsAt: new Date('2026-07-13T00:00:00.000Z'),
  endsAt: new Date('2026-07-27T23:59:59.999Z'),
  appliesToAllServices: true,
  createdAt: new Date('2026-07-10T00:00:00.000Z'),
};

describe('marketing calendar dates', () => {
  it('formats UTC calendar day without shifting in US local timezones', () => {
    expect(formatMarketingCalendarDate('2026-07-13T00:00:00.000Z')).toBe(
      'Jul 13, 2026'
    );
    expect(formatSaleDateRange(saleBase.startsAt, saleBase.endsAt)).toBe(
      'Jul 13, 2026 – Jul 27, 2026'
    );
  });

  it('treats the start calendar day as inside the window', () => {
    expect(
      compareMarketingCalendarDayToWindow(
        new Date('2026-07-13T18:00:00.000Z'),
        saleBase.startsAt,
        saleBase.endsAt
      )
    ).toBe('inside');
  });
});

describe('getSaleStatus', () => {
  it('is scheduled before the start calendar day', () => {
    expect(getSaleStatus(saleBase, new Date('2026-07-12T23:59:59.000Z'))).toBe(
      'scheduled'
    );
  });

  it('is active on the start calendar day (including early US local morning)', () => {
    // July 13 01:00 CDT = July 13 06:00 UTC — still the start UTC day
    expect(
      getSaleStatus(saleBase, new Date('2026-07-13T01:00:00.000-05:00'))
    ).toBe('active');
  });

  it('is active late on the end calendar day', () => {
    expect(getSaleStatus(saleBase, new Date('2026-07-27T23:00:00.000Z'))).toBe(
      'active'
    );
  });

  it('is expired after the end calendar day', () => {
    expect(getSaleStatus(saleBase, new Date('2026-07-28T00:00:00.000Z'))).toBe(
      'expired'
    );
  });
});

describe('getPromoCodeStatus', () => {
  const promo: PromoCode = {
    id: 'promo-1',
    code: 'SAVE25',
    discountType: 'percentage',
    discountValue: 25,
    isActive: true,
    startsAt: new Date('2026-07-13T00:00:00.000Z'),
    endsAt: new Date('2026-07-27T23:59:59.999Z'),
    maxUses: null,
    currentUseCount: 0,
    oneUsePerCustomer: true,
    createdAt: new Date('2026-07-10T00:00:00.000Z'),
  };

  it('uses UTC calendar days for scheduled vs active', () => {
    expect(
      getPromoCodeStatus(promo, new Date('2026-07-12T23:00:00.000Z'))
    ).toBe('scheduled');
    expect(
      getPromoCodeStatus(promo, new Date('2026-07-13T00:30:00.000-05:00'))
    ).toBe('active');
  });
});
