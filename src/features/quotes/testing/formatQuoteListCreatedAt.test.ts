import { formatQuoteListCreatedAt } from '@/features/quotes/dashboard/utils/quoteStatusUi';
import { describe, expect, it } from 'vitest';

describe('formatQuoteListCreatedAt', () => {
  it('returns a non-empty string for valid ISO dates', () => {
    const s = formatQuoteListCreatedAt('2026-06-15T12:00:00.000Z');
    expect(s.length).toBeGreaterThan(0);
  });

  it('returns empty string for invalid input', () => {
    expect(formatQuoteListCreatedAt('')).toBe('');
    expect(formatQuoteListCreatedAt('not-a-date')).toBe('');
  });
});
