import { describe, expect, it } from 'vitest';
import { parseRevenueQuery } from '../parseRevenueQuery';

describe('parseRevenueQuery', () => {
  it('defaults to month in UTC when params are empty', () => {
    const result = parseRevenueQuery(new URLSearchParams());
    expect(result).toEqual({
      ok: true,
      query: {
        period: 'month',
        timeZone: 'UTC',
        customFrom: undefined,
        customTo: undefined,
      },
    });
  });

  it('treats ytd as the calendar year', () => {
    const result = parseRevenueQuery(new URLSearchParams('period=ytd'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.query.period).toBe('year');
  });

  it('keeps a valid IANA time zone', () => {
    const result = parseRevenueQuery(
      new URLSearchParams('period=month&timeZone=America/Chicago')
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.query.timeZone).toBe('America/Chicago');
    expect(result.query.period).toBe('month');
  });

  it('accepts all time', () => {
    const result = parseRevenueQuery(new URLSearchParams('period=all'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.query.period).toBe('all');
  });

  it('requires from and to for a custom range', () => {
    const result = parseRevenueQuery(new URLSearchParams('period=custom'));
    expect(result.ok).toBe(false);
  });

  it('rejects a custom range that is a single day', () => {
    const result = parseRevenueQuery(
      new URLSearchParams('period=custom&from=2026-08-10&to=2026-08-10')
    );
    expect(result.ok).toBe(false);
  });
});
