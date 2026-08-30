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
  shopAddressFieldsFromLocation,
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
  petName: '',
  petSpecies: '',
  petBreed: '',
  petSize: '',
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
  shopCity: '',
  shopState: '',
  shopZip: '',
  hasCompleteShopAddress: false,
};

const shopOnly: PublicBookingServiceLocation = {
  mode: 'shop_only',
  profileLocationLabel: 'Austin, TX 78701',
  shopAddressLabel: '410 E Pecan St, Suite 2, Pflugerville, TX 78660',
  shopStreet: '410 E Pecan St',
  shopUnit: 'Suite 2',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  shopCity: 'Pflugerville',
  shopState: 'TX',
  shopZip: '78660',
  hasCompleteShopAddress: true,
};

const both: PublicBookingServiceLocation = {
  ...shopOnly,
  mode: 'both',
};

describe('bookingServiceLocationFlow', () => {
  it('contact (with address fields collapsed in) always leads to vehicle notes', () => {
    expect(getNextDetailsSubStep('contact', mobileOnly, null)).toBe(
      'vehicleNotes'
    );
    expect(customerAddressEntryRequired(mobileOnly, null)).toBe(true);
  });

  it('shop_only does not require address fields on the contact screen', () => {
    expect(getNextDetailsSubStep('contact', shopOnly, null)).toBe(
      'vehicleNotes'
    );
    expect(customerAddressEntryRequired(shopOnly, null)).toBe(false);
    expect(customerBookingUsesShop(shopOnly, null)).toBe(true);
  });

  it('both mode requires address fields on contact only when customer chose mobile', () => {
    expect(getNextDetailsSubStep('contact', both, 'mobile')).toBe(
      'vehicleNotes'
    );
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

  it('reads shop city from shop_* not the mobile serving city', () => {
    expect(shopAddressFieldsFromLocation(shopOnly)).toEqual({
      streetAddress: '410 E Pecan St',
      unitApt: 'Suite 2',
      city: 'Pflugerville',
      state: 'TX',
      zip: '78660',
    });
  });

  it('prefills customer with shop address', () => {
    const filled = prefillCustomerWithShopAddress(
      contactOnlyCustomer,
      shopOnly
    );
    expect(filled.streetAddress).toBe('410 E Pecan St');
    expect(filled.city).toBe('Pflugerville');
    expect(filled.zip).toBe('78660');
    expect(filled.city).not.toBe('Austin');
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

  it('requires address fields on the contact screen when the customer chose mobile', () => {
    expect(
      isBookingDetailsSubStepValid(
        'contact',
        contactOnlyCustomer,
        both,
        'mobile',
        {
          showVehicleFields: false,
          emailOptional: true,
        }
      )
    ).toBe(false);
    expect(
      isBookingDetailsSubStepValid(
        'contact',
        customerWithAddress,
        both,
        'mobile',
        {
          showVehicleFields: false,
          emailOptional: true,
        }
      )
    ).toBe(true);
  });

  it('does not require address fields on the contact screen when the customer chose shop', () => {
    expect(
      isBookingDetailsSubStepValid(
        'contact',
        contactOnlyCustomer,
        both,
        'shop',
        {
          showVehicleFields: false,
          emailOptional: true,
        }
      )
    ).toBe(true);
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

  it('requires pet fields when configured', () => {
    expect(
      isBookingDetailsSubStepValid(
        'vehicleNotes',
        customerWithAddress,
        mobileOnly,
        null,
        {
          showVehicleFields: false,
          showPetFields: true,
          requirePetFields: true,
          emailOptional: true,
        }
      )
    ).toBe(false);
    expect(
      isBookingDetailsSubStepValid(
        'vehicleNotes',
        {
          ...customerWithAddress,
          petName: 'Buddy',
          petSpecies: 'Dog',
          petBreed: 'Golden Retriever',
          petSize: 'Medium',
        },
        mobileOnly,
        null,
        {
          showVehicleFields: false,
          showPetFields: true,
          requirePetFields: true,
          emailOptional: true,
        }
      )
    ).toBe(true);
  });

  it('navigates back from vehicle notes to the merged contact screen', () => {
    expect(getPrevDetailsSubStep('vehicleNotes', mobileOnly, null)).toBe(
      'contact'
    );
    expect(getPrevDetailsSubStep('vehicleNotes', shopOnly, null)).toBe(
      'contact'
    );
    expect(getPrevDetailsSubStep('vehicleNotes', both, 'shop')).toBe('contact');
    expect(getPrevDetailsSubStep('vehicleNotes', both, 'mobile')).toBe(
      'contact'
    );
    expect(getPrevDetailsSubStep('contact', both, 'mobile')).toBe('schedule');
  });
});
