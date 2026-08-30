import type { StructuredLocation } from '@/features/location/types/location';
import type {
  PrimaryServiceArea,
  PublicServiceCoverage,
} from '../types/primaryServiceArea';
import { formatServiceArea } from './businessLocation';

export function toPublicServiceCoverage(
  area: PrimaryServiceArea
): PublicServiceCoverage {
  return {
    city: area.city,
    stateCode: area.stateCode,
    postalCode: area.postalCode,
    radiusMiles: area.radiusMiles,
    label: area.label,
  };
}

export function primaryServiceAreaToStructuredLocation(
  area: PrimaryServiceArea
): StructuredLocation {
  return {
    providerId: area.providerPlaceId ?? '',
    label: area.label,
    searchValue: area.label,
    city: area.city,
    state: area.stateCode,
    zip: area.postalCode ?? '',
    latitude: area.latitude,
    longitude: area.longitude,
    placeType: area.placeType ?? 'place',
  };
}

export function structuredLocationToPrimaryServiceArea(
  location: StructuredLocation,
  radiusMiles: number,
  previousId = ''
): PrimaryServiceArea {
  const city = location.city.trim();
  const stateCode = location.state.trim().toUpperCase().slice(0, 2);
  const postalCode = location.zip.trim() || null;

  return {
    id: previousId,
    label: location.label.trim() || formatServiceArea(city, stateCode),
    city,
    stateCode,
    postalCode,
    latitude: location.latitude,
    longitude: location.longitude,
    radiusMiles,
    placeType: location.placeType || null,
    providerPlaceId: location.providerId || null,
  };
}

/** e.g. "Austin, TX · 25 mi" */
export function formatServiceCoverageLabel(
  city: string,
  state: string,
  radiusMiles?: number | null
): string | null {
  const area = formatServiceArea(city, state);
  if (!area) return null;
  if (
    radiusMiles == null ||
    !Number.isFinite(radiusMiles) ||
    radiusMiles <= 0
  ) {
    return area;
  }
  return `${area} · ${Math.round(radiusMiles)} mi`;
}

export function isServiceCoverageDirty(
  initial: { location: StructuredLocation | null; radiusMiles: number },
  current: { location: StructuredLocation | null; radiusMiles: number }
): boolean {
  if (!initial.location && !current.location) {
    return current.radiusMiles !== initial.radiusMiles;
  }
  if (!initial.location || !current.location) return true;
  if (current.radiusMiles !== initial.radiusMiles) return true;

  return (
    current.location.latitude !== initial.location.latitude ||
    current.location.longitude !== initial.location.longitude ||
    current.location.city.trim() !== initial.location.city.trim() ||
    current.location.state.trim().toUpperCase() !==
      initial.location.state.trim().toUpperCase() ||
    (current.location.providerId || '') !== (initial.location.providerId || '')
  );
}

export function validateServiceCoverage(
  location: StructuredLocation | null,
  radiusMiles: number
): string[] {
  const errors: string[] = [];

  if (!location) {
    errors.push('Choose a suggested location to confirm it');
    return errors;
  }

  if (!location.city.trim() || location.state.trim().length !== 2) {
    errors.push('Choose a suggested city and state');
  }

  if (!Number.isFinite(radiusMiles) || radiusMiles < 1) {
    errors.push('Travel distance is required');
  }

  return errors;
}
