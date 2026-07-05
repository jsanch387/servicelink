import { describe, expect, it } from 'vitest';

import {
  serviceLocationPersistFromUi,
  serviceLocationUiFromProfile,
  validateServiceLocation,
} from '../utils/serviceLocationMode';

describe('serviceLocationUiFromProfile', () => {
  it('defaults to mobile_only', () => {
    expect(serviceLocationUiFromProfile({})).toEqual({
      mode: 'mobile_only',
      shopAddress: { streetAddress: '', unitApt: '' },
    });
  });

  it('hydrates shop fields', () => {
    expect(
      serviceLocationUiFromProfile({
        service_location_mode: 'both',
        shop_street_address: '123 Main St',
        shop_unit: 'Suite 4',
      })
    ).toEqual({
      mode: 'both',
      shopAddress: { streetAddress: '123 Main St', unitApt: 'Suite 4' },
    });
  });
});

describe('serviceLocationPersistFromUi', () => {
  it('clears shop fields for mobile_only', () => {
    expect(
      serviceLocationPersistFromUi({
        mode: 'mobile_only',
        shopAddress: { streetAddress: '123 Main St', unitApt: 'A' },
      })
    ).toEqual({
      service_location_mode: 'mobile_only',
      shop_street_address: null,
      shop_unit: null,
    });
  });

  it('persists shop fields when shop is offered', () => {
    expect(
      serviceLocationPersistFromUi({
        mode: 'shop_only',
        shopAddress: { streetAddress: '123 Main St', unitApt: 'Suite 4' },
      })
    ).toEqual({
      service_location_mode: 'shop_only',
      shop_street_address: '123 Main St',
      shop_unit: 'Suite 4',
    });
  });
});

describe('validateServiceLocation', () => {
  it('requires full shop address when shop is offered', () => {
    expect(
      validateServiceLocation(
        {
          mode: 'shop_only',
          shopAddress: { streetAddress: '123 Main St', unitApt: '' },
        },
        { city: '', state: '', zip: '' }
      )
    ).toContain('Shop address requires city, state, and ZIP');
  });

  it('requires shop street when shop is offered', () => {
    expect(
      validateServiceLocation({
        mode: 'shop_only',
        shopAddress: { streetAddress: '', unitApt: '' },
      })
    ).toContain('Shop street address is required');
  });

  it('skips shop validation for mobile_only', () => {
    expect(
      validateServiceLocation({
        mode: 'mobile_only',
        shopAddress: { streetAddress: '', unitApt: '' },
      })
    ).toEqual([]);
  });
});
