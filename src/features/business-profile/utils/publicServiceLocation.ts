import type { PublicServiceCoverage } from '../types/primaryServiceArea';
import {
  formatFullShopAddress,
  formatProfileLocationLabel,
  parseServiceAreaCityState,
  type ServiceLocationMode,
} from './location';
import { formatServiceCoverageLabel } from './primaryServiceArea';
import { serviceLocationUiFromProfile } from './serviceLocationMode';

/** Resolved service location for public booking (SSR → client). */
export interface PublicBookingServiceLocation {
  mode: ServiceLocationMode;
  profileLocationLabel: string | null;
  shopAddressLabel: string | null;
  shopStreet: string;
  shopUnit: string;
  /** Mobile serving city from service_area / coverage. */
  city: string;
  state: string;
  zip: string;
  /** Physical shop only. Empty when unset — do not treat serving city as shop. */
  shopCity: string;
  shopState: string;
  shopZip: string;
  hasCompleteShopAddress: boolean;
  /** Confirmed travel radius. Never includes lat/lng. */
  radiusMiles?: number | null;
  /** e.g. "Austin, TX · 25 mi" for the booking link. */
  coverageLabel?: string | null;
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
    shopCity: '',
    shopState: '',
    shopZip: '',
    hasCompleteShopAddress: false,
    radiusMiles: null,
    coverageLabel: null,
  };

export function buildPublicBookingServiceLocation(
  profile: {
    service_location_mode?: string | null;
    service_area?: string | null;
    business_zip?: string | null;
    shop_street_address?: string | null;
    shop_unit?: string | null;
    shop_city?: string | null;
    shop_state?: string | null;
    shop_zip?: string | null;
  },
  coverage?: PublicServiceCoverage | null
): PublicBookingServiceLocation {
  const { mode } = serviceLocationUiFromProfile(profile);
  const parsed = parseServiceAreaCityState(profile.service_area ?? '');
  const city = coverage?.city.trim() || parsed.city;
  const state = coverage?.stateCode.trim() || parsed.state;
  const zip =
    coverage?.postalCode?.trim() || profile.business_zip?.trim() || '';
  const shopStreet = profile.shop_street_address?.trim() ?? '';
  const shopUnit = profile.shop_unit?.trim() ?? '';
  const shopCity = profile.shop_city?.trim() ?? '';
  const shopState = profile.shop_state?.trim() ?? '';
  const shopZip = profile.shop_zip?.trim() ?? '';
  const radiusMiles =
    coverage && Number.isFinite(coverage.radiusMiles)
      ? coverage.radiusMiles
      : null;

  // Legacy street-only rows: display may use serving city. Never write this back.
  const displayCity = shopCity || city;
  const displayState = shopState || state;
  const displayZip = shopZip || (shopCity ? '' : zip);

  const profileLocationLabel = formatProfileLocationLabel(city, state, zip);
  const coverageLabel =
    formatServiceCoverageLabel(city, state, radiusMiles) ??
    profileLocationLabel;
  const shopAddressLabel = shopStreet
    ? formatFullShopAddress({
        street: shopStreet,
        unit: shopUnit || null,
        city: displayCity,
        state: displayState,
        zip: displayZip,
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
    shopCity,
    shopState,
    shopZip,
    hasCompleteShopAddress: Boolean(shopStreet && displayCity && displayState),
    radiusMiles,
    coverageLabel,
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
