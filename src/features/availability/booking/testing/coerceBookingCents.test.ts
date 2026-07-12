import { describe, expect, it } from 'vitest';
import { coerceBookingCents } from '../utils/coerceBookingCents';

describe('coerceBookingCents', () => {
  it('rounds finite numbers', () => {
    expect(coerceBookingCents(23500)).toBe(23500);
    expect(coerceBookingCents(19.6)).toBe(20);
  });

  it('parses numeric strings from mobile JSON', () => {
    expect(coerceBookingCents('23500')).toBe(23500);
    expect(coerceBookingCents(' 1500 ')).toBe(1500);
  });

  it('returns 0 for invalid values', () => {
    expect(coerceBookingCents(undefined)).toBe(0);
    expect(coerceBookingCents(null)).toBe(0);
    expect(coerceBookingCents('')).toBe(0);
    expect(coerceBookingCents(Number.NaN)).toBe(0);
  });
});
