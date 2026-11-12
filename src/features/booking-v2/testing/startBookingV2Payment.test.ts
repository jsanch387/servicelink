import { describe, expect, it } from 'vitest';
import { bookingV2JobsForCheckout } from '../utils/startBookingV2Payment';
import type { BookingV2CartItem } from '../types';

const item = (
  overrides: Partial<BookingV2CartItem> = {}
): BookingV2CartItem => ({
  serviceId: 'svc-1',
  serviceName: 'Signature Shinee',
  priceOptionId: 'suv',
  priceOptionLabel: 'SUV',
  addOnIds: ['rain', 'engine'],
  addOns: [
    { id: 'rain', name: 'Windshield Rain Repellent', priceCents: 7500 },
    { id: 'engine', name: 'Engine Bay Steam & Dress', priceCents: 6500 },
  ],
  vehicle: { year: '2021', make: 'Honda', model: 'Accord' },
  dueCents: 31500,
  originalCents: 35000,
  durationMinutes: 240,
  ...overrides,
});

describe('bookingV2JobsForCheckout', () => {
  it('keeps add-on prices off the service price so the visit is not double counted', () => {
    const [job] = bookingV2JobsForCheckout([item()]);
    expect(job.servicePriceCents).toBe(21000);
    expect(job.selectedAddOns.map(addOn => addOn.priceCents)).toEqual([
      7500, 6500,
    ]);
    expect(job.durationMinutes).toBe(240);
    expect(job.vehicle).toEqual({
      year: '2021',
      make: 'Honda',
      model: 'Accord',
    });
    expect(job.servicePriceOptionLabel).toBe('SUV');
  });

  it('sends the pet on a pet job and leaves the vehicle empty', () => {
    const [job] = bookingV2JobsForCheckout([
      item({
        vehicle: { year: '', make: '', model: '' },
        pet: {
          name: 'Buddy',
          species: 'Dog',
          breed: 'Golden Retriever',
          size: 'Large',
        },
      }),
    ]);
    expect(job.pet).toEqual({
      name: 'Buddy',
      species: 'Dog',
      breed: 'Golden Retriever',
      size: 'Large',
    });
    expect(job.vehicle).toEqual({ year: '', make: '', model: '' });
  });
});
