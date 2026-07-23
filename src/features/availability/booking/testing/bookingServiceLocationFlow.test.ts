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
  isCustomerServiceLocationChoiceValid,
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

const customerWithAddress: CustomerFormData = {
  ...contactOnlyCustomer,
  streetAddress: '123 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
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
  it('mobile_only skips choice and requires address after contact', () => {
    expect(getNextDetailsSubStep('contact', mobileOnly, null)).toBe('address');
    expect(customerAddressEntryRequired(mobileOnly, null)).toBe(true);
  });

  it('shop_only skips address and goes to vehicle notes after contact', () => {
    expect(getNextDetailsSubStep('contact', shopOnly, null)).toBe(
      'vehicleNotes'
    );
    expect(customerAddressEntryRequired(shopOnly, null)).toBe(false);
    expect(customerBookingUsesShop(shopOnly, null)).toBe(true);
  });

  it('both mode branches address from the pre-calendar location choice', () => {
    expect(getNextDetailsSubStep('contact', both, 'mobile')).toBe('address');
    expect(getNextDetailsSubStep('contact', both, 'shop')).toBe('vehicleNotes');
    expect(customerAddressEntryRequired(both, 'mobile')).toBe(true);
    expect(customerAddressEntryRequired(both, 'shop')).toBe(false);
  });

  it('validates mobile vs shop choice before calendar', () => {
    expect(isCustomerServiceLocationChoiceValid(both, null)).toBe(false);
    expect(isCustomerServiceLocationChoiceValid(both, 'mobile')).toBe(true);
    expect(isCustomerServiceLocationChoiceValid(both, 'shop')).toBe(true);
    expect(
      isCustomerServiceLocationChoiceValid(
        { ...both, hasCompleteShopAddress: false },
        'shop'
      )
    ).toBe(false);
    expect(isCustomerServiceLocationChoiceValid(mobileOnly, null)).toBe(true);
  });

  it('blocks contact continue when shop address is incomplete', () => {
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
    const prefilled = prefillCustomerWithShopAddress(contactOnlyCustomer, both);
    expect(
      isBookingDetailsSubStepValid('address', prefilled, both, 'shop', {
        showVehicleFields: false,
        emailOptional: false,
      })
    ).toBe(false);
  });

  it('allows visible vehicle fields to be optional for owner manual booking', () => {
    expect(
      isBookingDetailsSubStepValid(
        'vehicleNotes',
        customerWithAddress,
        mobileOnly,
        null,
        {
          showVehicleFields: true,
          requireVehicleFields: false,
          emailOptional: true,
        }
      )
    ).toBe(true);
  });

  it('rejects partial optional vehicle fields', () => {
    expect(
      isBookingDetailsSubStepValid(
        'vehicleNotes',
        {
          ...customerWithAddress,
          vehicleYear: '2018',
          vehicleMake: '',
          vehicleModel: '',
        },
        mobileOnly,
        null,
        {
          showVehicleFields: true,
          requireVehicleFields: false,
          emailOptional: true,
        }
      )
    ).toBe(false);
  });

  it('still requires visible vehicle fields when configured as required', () => {
    expect(
      isBookingDetailsSubStepValid(
        'vehicleNotes',
        customerWithAddress,
        mobileOnly,
        null,
        {
          showVehicleFields: true,
          requireVehicleFields: true,
          emailOptional: true,
        }
      )
    ).toBe(false);
  });

  it('navigates back from vehicle notes without a post-schedule location step', () => {
    expect(getPrevDetailsSubStep('vehicleNotes', mobileOnly, null)).toBe(
      'address'
    );
    expect(getPrevDetailsSubStep('vehicleNotes', shopOnly, null)).toBe(
      'contact'
    );
    expect(getPrevDetailsSubStep('vehicleNotes', both, 'shop')).toBe('contact');
    expect(getPrevDetailsSubStep('vehicleNotes', both, 'mobile')).toBe(
      'address'
    );
    expect(getPrevDetailsSubStep('address', both, 'mobile')).toBe('contact');
  });
});
