import { describe, expect, it, vi } from 'vitest';

import {
  isAnalyticsPeriod,
  isProOnlyLinkViewsPeriod,
  periodToSinceIso,
  resolveLinkViewsPeriodForAccess,
} from '../constants';

describe('analytics period helpers', () => {
  it('isAnalyticsPeriod validates known periods', () => {
    expect(isAnalyticsPeriod('24h')).toBe(true);
    expect(isAnalyticsPeriod('7d')).toBe(true);
    expect(isAnalyticsPeriod('30d')).toBe(true);
    expect(isAnalyticsPeriod('all')).toBe(true);
    expect(isAnalyticsPeriod('1h')).toBe(false);
  });

  it('periodToSinceIso returns windows relative to now', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-21T12:00:00.000Z'));

    expect(periodToSinceIso('24h')).toBe('2026-05-20T12:00:00.000Z');
    expect(periodToSinceIso('7d')).toBe('2026-05-14T12:00:00.000Z');
    expect(periodToSinceIso('30d')).toBe('2026-04-21T12:00:00.000Z');
    expect(periodToSinceIso('all')).toBeNull();

    vi.useRealTimers();
  });

  it('isProOnlyLinkViewsPeriod marks 7d and 30d', () => {
    expect(isProOnlyLinkViewsPeriod('7d')).toBe(true);
    expect(isProOnlyLinkViewsPeriod('30d')).toBe(true);
    expect(isProOnlyLinkViewsPeriod('24h')).toBe(false);
  });

  it('resolveLinkViewsPeriodForAccess clamps pro periods for free users', () => {
    expect(resolveLinkViewsPeriodForAccess('24h', false)).toBe('24h');
    expect(resolveLinkViewsPeriodForAccess('7d', false)).toBe('24h');
    expect(resolveLinkViewsPeriodForAccess('30d', false)).toBe('24h');
    expect(resolveLinkViewsPeriodForAccess('7d', true)).toBe('7d');
  });
});
