import { describe, expect, it } from 'vitest';

import {
  bookingCardServiceTitle,
  bookingServiceNameParts,
} from '../utils/bookingCardServiceTitle';

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

describe('bookingServiceNameParts', () => {
  it('splits name and option label', () => {
    expect(bookingServiceNameParts('Signature Shine — SUV')).toEqual({
      name: 'Signature Shine',
      optionLabel: 'SUV',
    });
  });

  it('returns null option when none present', () => {
    expect(bookingServiceNameParts('Signature Shine')).toEqual({
      name: 'Signature Shine',
      optionLabel: null,
    });
  });
});
