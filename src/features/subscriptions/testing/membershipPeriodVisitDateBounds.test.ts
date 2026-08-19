import { describe, expect, it } from 'vitest';
import {
  addCadenceToYmd,
  isYmdInInclusiveRange,
  resolveMembershipPeriodVisitDateBounds,
} from '../utils/membershipPeriodVisitDateBounds';

describe('addCadenceToYmd', () => {
  it('adds weeks, months, and years', () => {
    expect(addCadenceToYmd('2026-08-13', 'week', 1)).toBe('2026-08-20');
    expect(addCadenceToYmd('2026-08-13', 'week', 2)).toBe('2026-08-27');
    expect(addCadenceToYmd('2026-08-20', 'month', 1)).toBe('2026-09-20');
    expect(addCadenceToYmd('2026-08-13', 'year', 1)).toBe('2027-08-13');
  });
});

describe('resolveMembershipPeriodVisitDateBounds', () => {
  it('opens at next bill, not a month after the last visit', () => {
    const bounds = resolveMembershipPeriodVisitDateBounds({
      todayYmd: '2026-08-13',
      periodStartIso: '2026-08-14T00:17:00.000Z',
      periodEndIso: '2026-09-14T00:17:00.000Z',
      lastVisitYmd: '2026-08-24',
      intervalUnit: 'month',
      intervalCount: 1,
    });
    expect(bounds).toEqual({ minYmd: '2026-09-14', maxYmd: '2026-10-13' });
    expect(isYmdInInclusiveRange('2026-08-24', bounds!)).toBe(false);
    expect(isYmdInInclusiveRange('2026-09-14', bounds!)).toBe(true);
    expect(isYmdInInclusiveRange('2026-09-24', bounds!)).toBe(true);
  });

  it('uses the current Stripe period when the last visit was in the previous one', () => {
    const bounds = resolveMembershipPeriodVisitDateBounds({
      todayYmd: '2026-08-13',
      periodStartIso: '2026-09-14T00:00:00.000Z',
      periodEndIso: '2026-10-14T00:00:00.000Z',
      lastVisitYmd: '2026-08-24',
      intervalUnit: 'month',
      intervalCount: 1,
    });
    expect(bounds).toEqual({ minYmd: '2026-09-14', maxYmd: '2026-10-13' });
  });

  it('opens the next week after a weekly visit still in the current period', () => {
    const bounds = resolveMembershipPeriodVisitDateBounds({
      todayYmd: '2026-08-13',
      periodStartIso: '2026-08-13T00:00:00.000Z',
      periodEndIso: '2026-08-20T00:00:00.000Z',
      lastVisitYmd: '2026-08-13',
      intervalUnit: 'week',
      intervalCount: 1,
    });
    expect(bounds).toEqual({ minYmd: '2026-08-20', maxYmd: '2026-08-26' });
  });

  it('opens the next two-week window after an every-2-weeks visit', () => {
    const bounds = resolveMembershipPeriodVisitDateBounds({
      todayYmd: '2026-08-13',
      periodStartIso: '2026-08-13T00:00:00.000Z',
      periodEndIso: '2026-08-27T00:00:00.000Z',
      lastVisitYmd: '2026-08-13',
      intervalUnit: 'week',
      intervalCount: 2,
    });
    expect(bounds).toEqual({ minYmd: '2026-08-27', maxYmd: '2026-09-09' });
  });

  it('does not skip to the next period when the last visit was canceled', () => {
    const bounds = resolveMembershipPeriodVisitDateBounds({
      todayYmd: '2026-08-18',
      periodStartIso: '2026-08-13T00:00:00.000Z',
      periodEndIso: '2026-08-27T00:00:00.000Z',
      lastVisitYmd: null,
      intervalUnit: 'week',
      intervalCount: 2,
    });
    expect(bounds).toEqual({ minYmd: '2026-08-18', maxYmd: '2026-08-26' });
  });

  it('keeps a bi-weekly rebook in the two-week cycle even if Stripe period is longer', () => {
    const bounds = resolveMembershipPeriodVisitDateBounds({
      todayYmd: '2026-08-18',
      periodStartIso: '2026-08-13T00:00:00.000Z',
      periodEndIso: '2026-09-13T00:00:00.000Z',
      lastVisitYmd: null,
      intervalUnit: 'week',
      intervalCount: 2,
    });
    expect(bounds).toEqual({ minYmd: '2026-08-18', maxYmd: '2026-08-26' });
    expect(isYmdInInclusiveRange('2026-09-01', bounds!)).toBe(false);
  });

  it('does not allow past days inside an open period', () => {
    const bounds = resolveMembershipPeriodVisitDateBounds({
      todayYmd: '2026-10-01',
      periodStartIso: '2026-09-14T00:00:00.000Z',
      periodEndIso: '2026-10-14T00:00:00.000Z',
      lastVisitYmd: '2026-08-20',
      intervalUnit: 'month',
      intervalCount: 1,
    });
    expect(bounds).toEqual({ minYmd: '2026-10-01', maxYmd: '2026-10-13' });
  });
});
