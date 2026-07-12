import { describe, expect, it } from 'vitest';
import type { PublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';
import type { CustomerFormData } from '../types';
import {
  clearCustomerServiceAddress,
  customerAddressEntryRequired,
  customerBookingUsesShop,
  getNextDetailsSubStep,
  getPrevDetailsSubStep,
  isBookingDetailsSubStepValid,
  prefillCustomerWithShopAddress,
} from '../utils/bookingServiceLocationFlow';

const emptyCustomer: CustomerFormData = {
  fullName: '',
  email: '',
  phone: '',
  streetAddress: '',
  unitApt: '',
  city: '',
  state: '',
  zip: '',
  vehicleYear: '',
  vehicleMake: '',
  vehicleModel: '',
  notes: '',
};

const contactOnlyCustomer: CustomerFormData = {
  ...emptyCustomer,
  fullName: 'Jane',
  phone: '5551234567',
  email: '',
};

const mobileOnly: PublicBookingServiceLocation = {
  mode: 'mobile_only',
  profileLocationLabel: 'Austin, TX 78701',
  shopAddressLabel: null,
  shopStreet: '',
  shopUnit: '',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  hasCompleteShopAddress: false,
};

const shopOnly: PublicBookingServiceLocation = {
  mode: 'shop_only',
  profileLocationLabel: 'Austin, TX 78701',
  shopAddressLabel: '100 Main St, Suite 2, Austin, TX 78701',
  shopStreet: '100 Main St',
  shopUnit: 'Suite 2',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  hasCompleteShopAddress: true,
};

const both: PublicBookingServiceLocation = {
  ...shopOnly,
  mode: 'both',
};

describe('bookingServiceLocationFlow', () => {
  it('mobile_only skips choice and requires address', () => {
    expect(getNextDetailsSubStep('contact', mobileOnly, null)).toBe('address');
    expect(customerAddressEntryRequired(mobileOnly, null)).toBe(true);
  });

  it('shop_only skips shop visit and goes to vehicle notes after contact', () => {
    expect(getNextDetailsSubStep('contact', shopOnly, null)).toBe(
      'vehicleNotes'
    );
    expect(customerAddressEntryRequired(shopOnly, null)).toBe(false);
    expect(customerBookingUsesShop(shopOnly, null)).toBe(true);
  });

  it('both mode shows choice then branches', () => {
    expect(getNextDetailsSubStep('contact', both, null)).toBe('serviceChoice');
    expect(getNextDetailsSubStep('serviceChoice', both, 'mobile')).toBe(
      'address'
    );
    expect(getNextDetailsSubStep('serviceChoice', both, 'shop')).toBe(
      'vehicleNotes'
    );
  });

  it('blocks shop path when shop address is incomplete', () => {
    expect(
      isBookingDetailsSubStepValid(
        'serviceChoice',
        emptyCustomer,
        both,
        'shop',
        {
          showVehicleFields: false,
          emailOptional: false,
        }
      )
    ).toBe(true);
    expect(
      isBookingDetailsSubStepValid(
        'serviceChoice',
        emptyCustomer,
        { ...both, hasCompleteShopAddress: false },
        'shop',
        { showVehicleFields: false, emailOptional: false }
      )
    ).toBe(false);
    expect(
      isBookingDetailsSubStepValid(
        'contact',
        contactOnlyCustomer,
        { ...shopOnly, hasCompleteShopAddress: false },
        null,
        { showVehicleFields: false, emailOptional: false }
      )
    ).toBe(false);
  });

  it('prefills customer with shop address', () => {
    const filled = prefillCustomerWithShopAddress(
      contactOnlyCustomer,
      shopOnly
    );
    expect(filled.streetAddress).toBe('100 Main St');
    expect(filled.city).toBe('Austin');
    expect(filled.zip).toBe('78701');
  });

  it('clears customer address when switching to mobile', () => {
    const prefilled = prefillCustomerWithShopAddress(
      contactOnlyCustomer,
      shopOnly
    );
    const cleared = clearCustomerServiceAddress(prefilled);
    expect(cleared.streetAddress).toBe('');
    expect(cleared.city).toBe('');
    expect(cleared.zip).toBe('');
    expect(cleared.fullName).toBe('Jane');
  });

  it('does not treat address as valid on mobile path when choice is shop', () => {
    const prefilled = prefillCustomerWithShopAddress(
      contactOnlyCustomer,
      both
    );
    expect(
      isBookingDetailsSubStepValid('address', prefilled, both, 'shop', {
        showVehicleFields: false,
        emailOptional: false,
      })
    ).toBe(false);
  });

  it('service choice mobile always goes to address step', () => {
    expect(getNextDetailsSubStep('serviceChoice', both, 'mobile')).toBe(
      'address'
    );
  });

  it('navigates back from vehicle notes', () => {
    expect(getPrevDetailsSubStep('vehicleNotes', mobileOnly, null)).toBe(
      'address'
    );
    expect(getPrevDetailsSubStep('vehicleNotes', shopOnly, null)).toBe(
      'contact'
    );
    expect(getPrevDetailsSubStep('vehicleNotes', both, 'shop')).toBe(
      'serviceChoice'
    );
    expect(getPrevDetailsSubStep('vehicleNotes', both, 'mobile')).toBe(
      'address'
    );
  });
});
