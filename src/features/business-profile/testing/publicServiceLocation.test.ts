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
