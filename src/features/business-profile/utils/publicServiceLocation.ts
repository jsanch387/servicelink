import {
  formatFullShopAddress,
  formatProfileLocationLabel,
  parseServiceAreaCityState,
  type ServiceLocationMode,
} from './location';
import { serviceLocationUiFromProfile } from './serviceLocationMode';

/** Resolved service location for public booking (SSR → client). */
export interface PublicBookingServiceLocation {
  mode: ServiceLocationMode;
  profileLocationLabel: string | null;
  shopAddressLabel: string | null;
  shopStreet: string;
  shopUnit: string;
  city: string;
  state: string;
  zip: string;
  hasCompleteShopAddress: boolean;
}

export const DEFAULT_PUBLIC_BOOKING_SERVICE_LOCATION: PublicBookingServiceLocation =
  {
    mode: 'mobile_only',
    profileLocationLabel: null,
    shopAddressLabel: null,
    shopStreet: '',
    shopUnit: '',
    city: '',
    state: '',
    zip: '',
    hasCompleteShopAddress: false,
  };

export function buildPublicBookingServiceLocation(profile: {
  service_location_mode?: string | null;
  service_area?: string | null;
  business_zip?: string | null;
  shop_street_address?: string | null;
  shop_unit?: string | null;
}): PublicBookingServiceLocation {
  const { mode } = serviceLocationUiFromProfile(profile);
  const { city, state } = parseServiceAreaCityState(profile.service_area ?? '');
  const zip = profile.business_zip?.trim() ?? '';
  const shopStreet = profile.shop_street_address?.trim() ?? '';
  const shopUnit = profile.shop_unit?.trim() ?? '';

  const profileLocationLabel = formatProfileLocationLabel(city, state, zip);
  const shopAddressLabel = shopStreet
    ? formatFullShopAddress({
        street: shopStreet,
        unit: shopUnit || null,
        city,
        state,
        zip,
      })
    : null;

  return {
    mode,
    profileLocationLabel,
    shopAddressLabel,
    shopStreet,
    shopUnit,
    city,
    state,
    zip,
    hasCompleteShopAddress: Boolean(
      shopStreet && city && state && zip.length === 5
    ),
  };
}

export function resolveEffectiveCustomerServiceLocation(
  mode: ServiceLocationMode,
  choiceFromClient: 'mobile' | 'shop' | undefined | null
): { effective: 'mobile' | 'shop' | null; error?: string } {
  if (mode === 'mobile_only') return { effective: 'mobile' };
  if (mode === 'shop_only') return { effective: 'shop' };

  if (choiceFromClient === 'mobile' || choiceFromClient === 'shop') {
    return { effective: choiceFromClient };
  }

  return {
    effective: null,
    error: 'Please choose mobile or shop service',
  };
}

export function customerUsesShopAddress(
  mode: ServiceLocationMode,
  effectiveChoice: 'mobile' | 'shop'
): boolean {
  return effectiveChoice === 'shop';
}
