/**
 * UI state for business service location (mobile / shop / both).
 * @see docs/serviceLocation.md
 */

export type ServiceLocationMode = 'mobile_only' | 'shop_only' | 'both';

const SERVICE_LOCATION_MODES: ServiceLocationMode[] = [
  'mobile_only',
  'shop_only',
  'both',
];

/** Street-level address when customers visit a shop. City/state/ZIP come from profile. */
export interface ShopAddressUiState {
  streetAddress: string;
  unitApt: string;
}

export interface ServiceLocationUiState {
  mode: ServiceLocationMode;
  shopAddress: ShopAddressUiState;
}

export const EMPTY_SHOP_ADDRESS: ShopAddressUiState = {
  streetAddress: '',
  unitApt: '',
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

/** Maps `business_profiles` service location columns to dashboard edit UI state. */
export function serviceLocationUiFromProfile(profile: {
  service_location_mode?: string | null;
  shop_street_address?: string | null;
  shop_unit?: string | null;
}): ServiceLocationUiState {
  const mode = isServiceLocationMode(profile.service_location_mode)
    ? profile.service_location_mode
    : 'mobile_only';

  return {
    mode,
    shopAddress: {
      streetAddress: profile.shop_street_address?.trim() || '',
      unitApt: profile.shop_unit?.trim() || '',
    },
  };
}

export function serviceLocationPersistFromUi(ui: ServiceLocationUiState): {
  service_location_mode: ServiceLocationMode;
  shop_street_address: string | null;
  shop_unit: string | null;
} {
  const offersShop = shopAddressIsOffered(ui.mode);
  const street = ui.shopAddress.streetAddress.trim();
  const unit = ui.shopAddress.unitApt.trim();

  return {
    service_location_mode: ui.mode,
    shop_street_address: offersShop ? street || null : null,
    shop_unit: offersShop && unit ? unit : null,
  };
}

export function validateServiceLocation(
  ui: ServiceLocationUiState,
  profileLocation?: { city: string; state: string; zip: string }
): string[] {
  const errors: string[] = [];

  if (!shopAddressIsOffered(ui.mode)) {
    return errors;
  }

  if (!ui.shopAddress.streetAddress.trim()) {
    errors.push('Shop street address is required');
  }

  if (profileLocation) {
    const city = profileLocation.city.trim();
    const state = profileLocation.state.trim();
    const zip = profileLocation.zip.trim();

    if (!city || !state || !zip) {
      errors.push('Shop address requires city, state, and ZIP');
    }
  }

  return errors;
}

export function shopAddressIsOffered(mode: ServiceLocationMode): boolean {
  return mode === 'shop_only' || mode === 'both';
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
      return 'They come to you. No address needed from the customer.';
    case 'both':
      return 'Customers pick mobile or shop when they book.';
    default:
      return '';
  }
}
