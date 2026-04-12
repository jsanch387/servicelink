import { quoteStartTimeToHHmm } from '@/features/quotes/server/createBookingFromApprovedQuote';
import { describe, expect, it } from 'vitest';

describe('quoteStartTimeToHHmm', () => {
  it('returns HH:mm from Postgres-style time strings', () => {
    expect(quoteStartTimeToHHmm('09:30:00')).toBe('09:30');
    expect(quoteStartTimeToHHmm('14:05:00')).toBe('14:05');
  });

  it('returns default when empty', () => {
    expect(quoteStartTimeToHHmm(null)).toBe('09:00');
    expect(quoteStartTimeToHHmm('')).toBe('09:00');
  });

  it('accepts HH:mm input', () => {
    expect(quoteStartTimeToHHmm('10:15')).toBe('10:15');
  });
});
