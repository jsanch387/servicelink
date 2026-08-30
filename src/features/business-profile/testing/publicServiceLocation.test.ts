import { describe, expect, it } from 'vitest';
import {
  buildPublicBookingServiceLocation,
  customerUsesShopAddress,
  resolveEffectiveCustomerServiceLocation,
} from '../utils/publicServiceLocation';

describe('publicServiceLocation', () => {
  it('builds shop address from profile fields', () => {
    const loc = buildPublicBookingServiceLocation({
      service_location_mode: 'shop_only',
      service_area: 'Austin, TX',
      business_zip: '78701',
      shop_street_address: '100 Main St',
      shop_unit: 'Suite 2',
    });
    expect(loc.mode).toBe('shop_only');
    expect(loc.hasCompleteShopAddress).toBe(true);
    expect(loc.shopAddressLabel).toContain('100 Main St');
    expect(loc.shopAddressLabel).toContain('78701');
    expect(loc.radiusMiles).toBeNull();
    expect(loc.coverageLabel).toBe('Austin, TX');
  });

  it('uses confirmed service coverage for city, state, and radius', () => {
    const loc = buildPublicBookingServiceLocation(
      {
        service_location_mode: 'mobile_only',
        service_area: 'Legacy City, CA',
        business_zip: '90001',
        shop_street_address: '',
        shop_unit: '',
      },
      {
        city: 'Austin',
        stateCode: 'TX',
        postalCode: '78701',
        radiusMiles: 25,
        label: 'Austin, Texas, United States',
      }
    );

    expect(loc.city).toBe('Austin');
    expect(loc.state).toBe('TX');
    expect(loc.zip).toBe('78701');
    expect(loc.radiusMiles).toBe(25);
    expect(loc.coverageLabel).toBe('Austin, TX · 25 mi');
  });

  it('marks incomplete shop when street missing', () => {
    const loc = buildPublicBookingServiceLocation({
      service_location_mode: 'shop_only',
      service_area: 'Austin, TX',
      business_zip: '78701',
      shop_street_address: '',
      shop_unit: '',
    });
    expect(loc.hasCompleteShopAddress).toBe(false);
  });

  it('resolves effective location per mode', () => {
    expect(
      resolveEffectiveCustomerServiceLocation('mobile_only', undefined)
        .effective
    ).toBe('mobile');
    expect(
      resolveEffectiveCustomerServiceLocation('shop_only', undefined).effective
    ).toBe('shop');
    expect(
      resolveEffectiveCustomerServiceLocation('both', 'mobile').effective
    ).toBe('mobile');
    expect(
      resolveEffectiveCustomerServiceLocation('both', undefined).error
    ).toBeTruthy();
  });

  it('customerUsesShopAddress matches mode and choice', () => {
    expect(customerUsesShopAddress('shop_only', 'shop')).toBe(true);
    expect(customerUsesShopAddress('both', 'shop')).toBe(true);
    expect(customerUsesShopAddress('both', 'mobile')).toBe(false);
    expect(customerUsesShopAddress('mobile_only', 'mobile')).toBe(false);
  });
});
