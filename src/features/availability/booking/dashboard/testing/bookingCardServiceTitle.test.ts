import { describe, expect, it } from 'vitest';

import { bookingCardServiceTitle } from '../utils/bookingCardServiceTitle';

describe('bookingCardServiceTitle', () => {
  it('returns base name without price option suffix', () => {
    expect(bookingCardServiceTitle('Full Detail — Premium')).toBe(
      'Full Detail'
    );
  });

  it('returns trimmed name when no option suffix', () => {
    expect(bookingCardServiceTitle('  Interior Clean  ')).toBe(
      'Interior Clean'
    );
  });

  it('falls back to Service for empty input', () => {
    expect(bookingCardServiceTitle('')).toBe('Service');
    expect(bookingCardServiceTitle(null)).toBe('Service');
  });
});
