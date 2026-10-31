import { DEFAULT_PUBLIC_BOOKING_SERVICE_LOCATION } from '@/features/business-profile/utils/publicServiceLocation';
import { describe, expect, it } from 'vitest';
import { createEmptyVisit } from '../types';
import { seedVisitFromSavedCustomer } from '../utils/seedVisitFromSavedCustomer';

const customer = {
  customerName: 'Ada Lovelace',
  email: 'ada@shop.com',
  phone: '(512) 555-0100',
  notes: 'Gate code 1234',
  address: {
    street: '12 Main',
    unit: 'Apt 2',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
  },
};

describe('seedVisitFromSavedCustomer', () => {
  it('fills the customer and uses their address for a mobile visit', () => {
    const seeded = seedVisitFromSavedCustomer({
      base: createEmptyVisit(),
      serviceLocation: DEFAULT_PUBLIC_BOOKING_SERVICE_LOCATION,
      details: customer,
    });

    expect(seeded.locationSeeded).toBe(true);
    expect(seeded.visit.customer).toEqual({
      fullName: 'Ada Lovelace',
      email: 'ada@shop.com',
      phone: '5125550100',
    });
    expect(seeded.visit.notes).toBe('Gate code 1234');
    expect(seeded.visit.locationType).toBe('mobile');
    expect(seeded.visit.address.street).toBe('12 Main');
    expect(seeded.visit.address.unit).toBe('Apt 2');
  });

  it('keeps the shop address when the business is shop only', () => {
    const seeded = seedVisitFromSavedCustomer({
      base: createEmptyVisit(),
      serviceLocation: {
        ...DEFAULT_PUBLIC_BOOKING_SERVICE_LOCATION,
        mode: 'shop_only',
        shopStreet: '9 Shop St',
        shopCity: 'Austin',
        shopState: 'TX',
        shopZip: '78702',
        hasCompleteShopAddress: true,
      },
      details: customer,
    });

    expect(seeded.visit.locationType).toBe('shop');
    expect(seeded.visit.address.street).toBe('9 Shop St');
    expect(seeded.visit.customer.fullName).toBe('Ada Lovelace');
  });

  it('leaves location unset when both modes are offered and there is no address', () => {
    const seeded = seedVisitFromSavedCustomer({
      base: createEmptyVisit(),
      serviceLocation: {
        ...DEFAULT_PUBLIC_BOOKING_SERVICE_LOCATION,
        mode: 'both',
      },
      details: { ...customer, address: null },
    });

    expect(seeded.locationSeeded).toBe(false);
    expect(seeded.visit.locationType).toBeNull();
    expect(seeded.visit.customer.phone).toBe('5125550100');
  });
});
