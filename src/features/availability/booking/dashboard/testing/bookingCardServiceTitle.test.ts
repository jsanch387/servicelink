import { describe, expect, it } from 'vitest';

import {
  bookingCardServiceTitle,
  bookingListServiceTitle,
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

  it('keeps + N more on multi-job stored summaries', () => {
    expect(bookingCardServiceTitle('Signature Shine — SUV + 1 more')).toBe(
      'Signature Shine + 1 more'
    );
    expect(bookingCardServiceTitle('Wash + 2 more')).toBe('Wash + 2 more');
  });
});

describe('bookingListServiceTitle', () => {
  it('builds + N more from jobs when present', () => {
    expect(
      bookingListServiceTitle({
        serviceName: 'ignored',
        jobs: [
          {
            serviceName: 'Exterior wash',
            servicePriceOptionLabel: null,
            servicePriceCents: 100,
            durationMinutes: 30,
            selectedAddOns: [],
            vehicleLabel: null,
          },
          {
            serviceName: 'Interior',
            servicePriceOptionLabel: null,
            servicePriceCents: 100,
            durationMinutes: 30,
            selectedAddOns: [],
            vehicleLabel: null,
          },
        ],
      })
    ).toBe('Exterior wash + 1 more');
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
