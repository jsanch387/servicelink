import { describe, expect, it } from 'vitest';

import { isUntouchedSampleService } from '../sampleServices';

describe('isUntouchedSampleService', () => {
  it('recognizes the detailing sample created at signup', () => {
    expect(
      isUntouchedSampleService({
        name: 'Full Detail',
        description: 'Full detail. Edit the price and time anytime.',
        priceCents: 15000,
        durationMinutes: 120,
      })
    ).toBe(true);
  });

  it('treats a price change or an added service as the owner’s own', () => {
    expect(
      isUntouchedSampleService({
        name: 'Full Detail',
        description: 'Full detail. Edit the price and time anytime.',
        priceCents: 18000,
        durationMinutes: 120,
      })
    ).toBe(false);
    expect(
      isUntouchedSampleService({
        name: 'Interior Detail',
        description: 'Seats and carpets.',
        priceCents: 8000,
        durationMinutes: 60,
      })
    ).toBe(false);
  });
});
