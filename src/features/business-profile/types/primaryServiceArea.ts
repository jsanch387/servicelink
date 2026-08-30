/** Owner primary row from `business_service_areas`. */
export interface PrimaryServiceArea {
  id: string;
  label: string;
  city: string;
  stateCode: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  radiusMiles: number;
  placeType: string | null;
  providerPlaceId: string | null;
}

/**
 * Public booking-link coverage. No coordinates — marketplace / public
 * pages must not expose lat/lng.
 */
export interface PublicServiceCoverage {
  city: string;
  stateCode: string;
  postalCode: string | null;
  radiusMiles: number;
  label: string;
}
