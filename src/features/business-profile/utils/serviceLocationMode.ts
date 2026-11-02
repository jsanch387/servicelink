/**
 * UI state for business service location (mobile / shop / both).
 * Shop city/state/ZIP are independent of Details coverage.
 * @see docs/serviceLocation.md
 */

import type { StructuredLocation } from '@/features/location/types/location';
import {
  formatFullShopAddress,
  formatServiceArea,
  isValidCityStateServiceArea,
  isValidUsZip,
} from './businessLocation';

export type ServiceLocationMode = 'mobile_only' | 'shop_only' | 'both';

const SERVICE_LOCATION_MODES: ServiceLocationMode[] = [
  'mobile_only',
  'shop_only',
  'both',
];

/** Physical shop address. Never reuse Details / mobile serving city, state, or ZIP. */
export interface ShopAddressUiState {
  streetAddress: string;
  unitApt: string;
  city: string;
  state: string;
  zip: string;
}

export interface ServiceLocationUiState {
  mode: ServiceLocationMode;
  shopAddress: ShopAddressUiState;
}

export const EMPTY_SHOP_ADDRESS: ShopAddressUiState = {
  streetAddress: '',
  unitApt: '',
  city: '',
  state: '',
  zip: '',
};

export const DEFAULT_SERVICE_LOCATION_UI: ServiceLocationUiState = {
  mode: 'mobile_only',
  shopAddress: { ...EMPTY_SHOP_ADDRESS },
};

function isServiceLocationMode(value: unknown): value is ServiceLocationMode {
  return (
    typeof value === 'string' &&
    SERVICE_LOCATION_MODES.includes(value as ServiceLocationMode)
  );
}

/** Maps `business_profiles` shop columns to dashboard edit UI state. */
export function serviceLocationUiFromProfile(profile: {
  service_location_mode?: string | null;
  shop_street_address?: string | null;
  shop_unit?: string | null;
  shop_city?: string | null;
  shop_state?: string | null;
  shop_zip?: string | null;
}): ServiceLocationUiState {
  const mode = isServiceLocationMode(profile.service_location_mode)
    ? profile.service_location_mode
    : 'mobile_only';

  return {
    mode,
    shopAddress: {
      streetAddress: profile.shop_street_address?.trim() || '',
      unitApt: profile.shop_unit?.trim() || '',
      city: profile.shop_city?.trim() || '',
      state: profile.shop_state?.trim() || '',
      zip: profile.shop_zip?.trim() || '',
    },
  };
}

export function serviceLocationPersistFromUi(ui: ServiceLocationUiState): {
  service_location_mode: ServiceLocationMode;
  shop_street_address: string | null;
  shop_unit: string | null;
  shop_city: string | null;
  shop_state: string | null;
  shop_zip: string | null;
} {
  const offersShop = shopAddressIsOffered(ui.mode);
  const street = ui.shopAddress.streetAddress.trim();
  const unit = ui.shopAddress.unitApt.trim();
  const city = ui.shopAddress.city.trim();
  const state = ui.shopAddress.state.trim().toUpperCase();
  const zip = ui.shopAddress.zip.trim();

  return {
    service_location_mode: ui.mode,
    shop_street_address: offersShop ? street || null : null,
    shop_unit: offersShop && unit ? unit : null,
    shop_city: offersShop ? city || null : null,
    shop_state: offersShop ? state || null : null,
    shop_zip: offersShop ? zip || null : null,
  };
}

export function validateServiceLocation(ui: ServiceLocationUiState): string[] {
  const errors: string[] = [];

  if (!shopAddressIsOffered(ui.mode)) {
    return errors;
  }

  const street = ui.shopAddress.streetAddress.trim();
  const city = ui.shopAddress.city.trim();
  const state = ui.shopAddress.state.trim();
  const zip = ui.shopAddress.zip.trim();

  if (!street || !city || !state) {
    errors.push('Choose a suggested shop address');
  } else if (!isValidCityStateServiceArea(formatServiceArea(city, state))) {
    errors.push('Shop location must use a valid city and 2-letter state');
  }

  if (zip && !isValidUsZip(zip)) {
    errors.push('Shop ZIP must be 5 digits');
  }

  return errors;
}

/** Autocomplete value for a saved shop — street + city/state/ZIP, no unit. */
export function formatShopPickerQuery(shop: ShopAddressUiState): string {
  return (
    formatFullShopAddress({
      street: shop.streetAddress,
      city: shop.city,
      state: shop.state,
      zip: shop.zip,
    }) ?? shop.streetAddress.trim()
  );
}

export function shopAddressFromStructuredLocation(
  location: StructuredLocation,
  unitApt: string
): ShopAddressUiState {
  return {
    streetAddress: location.street?.trim() || '',
    unitApt,
    city: location.city.trim(),
    state: location.state.trim(),
    zip: location.zip.trim(),
  };
}

export function shopAddressIsOffered(mode: ServiceLocationMode): boolean {
  return mode === 'shop_only' || mode === 'both';
}

/** Shop or Both without a confirmed shop city/state (legacy street-only rows). */
export function shopAddressNeedsUpdate(profile: {
  service_location_mode?: string | null;
  shop_street_address?: string | null;
  shop_city?: string | null;
  shop_state?: string | null;
}): boolean {
  const { mode } = serviceLocationUiFromProfile(profile);
  if (!shopAddressIsOffered(mode)) return false;
  return (
    !profile.shop_street_address?.trim() ||
    !profile.shop_city?.trim() ||
    !profile.shop_state?.trim()
  );
}

export function mobileServiceIsOffered(mode: ServiceLocationMode): boolean {
  return mode === 'mobile_only' || mode === 'both';
}

/** One-line helper shown under the mode selector in profile edit. */
export function serviceLocationModeHint(mode: ServiceLocationMode): string {
  switch (mode) {
    case 'mobile_only':
      return 'You go to them. Customers enter their address when booking.';
    case 'shop_only':
      return '';
    case 'both':
      return 'Customers pick mobile or shop when they book.';
    default:
      return '';
  }
}
