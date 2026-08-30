import { describe, expect, it } from 'vitest';

import {
  formatShopPickerQuery,
  serviceLocationPersistFromUi,
  serviceLocationUiFromProfile,
  shopAddressFromStructuredLocation,
  shopAddressNeedsUpdate,
  validateServiceLocation,
} from '../utils/serviceLocationMode';

const emptyShopAddress = {
  streetAddress: '',
  unitApt: '',
  city: '',
  state: '',
  zip: '',
};

const pflugervilleShop = {
  streetAddress: '410 E Pecan St',
  unitApt: '',
  city: 'Pflugerville',
  state: 'TX',
  zip: '78660',
};

describe('serviceLocationUiFromProfile', () => {
  it('defaults to mobile_only', () => {
    expect(serviceLocationUiFromProfile({})).toEqual({
      mode: 'mobile_only',
      shopAddress: emptyShopAddress,
    });
  });

  it('hydrates shop fields from shop_* only', () => {
    expect(
      serviceLocationUiFromProfile({
        service_location_mode: 'both',
        shop_street_address: '410 E Pecan St',
        shop_unit: 'Suite 4',
        shop_city: 'Pflugerville',
        shop_state: 'TX',
        shop_zip: '78660',
      })
    ).toEqual({
      mode: 'both',
      shopAddress: {
        streetAddress: '410 E Pecan St',
        unitApt: 'Suite 4',
        city: 'Pflugerville',
        state: 'TX',
        zip: '78660',
      },
    });
  });
});

describe('serviceLocationPersistFromUi', () => {
  it('nulls all shop_* for mobile_only', () => {
    expect(
      serviceLocationPersistFromUi({
        mode: 'mobile_only',
        shopAddress: pflugervilleShop,
      })
    ).toEqual({
      service_location_mode: 'mobile_only',
      shop_street_address: null,
      shop_unit: null,
      shop_city: null,
      shop_state: null,
      shop_zip: null,
    });
  });

  it('persists Pflugerville shop fields when shop is offered', () => {
    expect(
      serviceLocationPersistFromUi({
        mode: 'shop_only',
        shopAddress: {
          ...pflugervilleShop,
          unitApt: 'Suite 4',
        },
      })
    ).toEqual({
      service_location_mode: 'shop_only',
      shop_street_address: '410 E Pecan St',
      shop_unit: 'Suite 4',
      shop_city: 'Pflugerville',
      shop_state: 'TX',
      shop_zip: '78660',
    });
  });
});

describe('validateServiceLocation', () => {
  it('requires a confirmed MapTiler shop address', () => {
    expect(
      validateServiceLocation({
        mode: 'shop_only',
        shopAddress: {
          streetAddress: '410 E Pecan St',
          unitApt: '',
          city: '',
          state: '',
          zip: '',
        },
      })
    ).toContain('Choose a suggested shop address');
  });

  it('requires a shop pick when shop is offered', () => {
    expect(
      validateServiceLocation({
        mode: 'shop_only',
        shopAddress: emptyShopAddress,
      })
    ).toContain('Choose a suggested shop address');
  });

  it('accepts street + shop city + shop state without ZIP', () => {
    expect(
      validateServiceLocation({
        mode: 'shop_only',
        shopAddress: {
          ...pflugervilleShop,
          zip: '',
        },
      })
    ).toEqual([]);
  });

  it('rejects a partial shop ZIP', () => {
    expect(
      validateServiceLocation({
        mode: 'shop_only',
        shopAddress: {
          ...pflugervilleShop,
          zip: '786',
        },
      })
    ).toContain('Shop ZIP must be 5 digits');
  });

  it('maps a MapTiler street pick onto shop fields and keeps unit', () => {
    expect(
      shopAddressFromStructuredLocation(
        {
          providerId: 'address.1',
          label: '410 E Pecan St, Pflugerville, TX 78660',
          searchValue: '410 E Pecan St, Pflugerville, TX 78660',
          street: '410 E Pecan St',
          city: 'Pflugerville',
          state: 'TX',
          zip: '78660',
          latitude: 30.43,
          longitude: -97.62,
          placeType: 'address',
        },
        'Suite 4'
      )
    ).toEqual({
      streetAddress: '410 E Pecan St',
      unitApt: 'Suite 4',
      city: 'Pflugerville',
      state: 'TX',
      zip: '78660',
    });
  });

  it('formats the picker query without the unit', () => {
    expect(
      formatShopPickerQuery({
        ...pflugervilleShop,
        unitApt: 'Suite 4',
      })
    ).toBe('410 E Pecan St, Pflugerville, TX 78660');
  });

  it('flags legacy shop or both rows missing shop city', () => {
    expect(
      shopAddressNeedsUpdate({
        service_location_mode: 'both',
        shop_street_address: '123 Main St',
        shop_city: '',
        shop_state: '',
      })
    ).toBe(true);
    expect(
      shopAddressNeedsUpdate({
        service_location_mode: 'shop_only',
        shop_street_address: '410 E Pecan St',
        shop_city: 'Pflugerville',
        shop_state: 'TX',
      })
    ).toBe(false);
    expect(
      shopAddressNeedsUpdate({
        service_location_mode: 'mobile_only',
        shop_street_address: '',
      })
    ).toBe(false);
  });

  it('skips shop validation for mobile_only', () => {
    expect(
      validateServiceLocation({
        mode: 'mobile_only',
        shopAddress: emptyShopAddress,
      })
    ).toEqual([]);
  });
});
