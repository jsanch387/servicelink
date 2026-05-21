import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatLastVisit } from '../utils/formatLastVisit';

describe('formatLastVisit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-21T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns Never for null or invalid', () => {
    expect(formatLastVisit(null)).toBe('Never');
    expect(formatLastVisit('not-a-date')).toBe('Never');
  });

  it('returns Just now under 2 minutes', () => {
    expect(formatLastVisit('2026-05-21T11:59:30.000Z')).toBe('Just now');
  });

  it('returns minutes ago between 2 and 59 minutes', () => {
    expect(formatLastVisit('2026-05-21T11:45:00.000Z')).toBe('15m ago');
  });

  it('returns hours ago under 24 hours', () => {
    expect(formatLastVisit('2026-05-21T08:00:00.000Z')).toBe('4h ago');
  });

  it('returns days ago under 7 days', () => {
    expect(formatLastVisit('2026-05-19T12:00:00.000Z')).toBe('2d ago');
  });
});
