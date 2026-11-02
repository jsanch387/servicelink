import { describe, expect, it } from 'vitest';
import type { StructuredLocation } from '@/features/location/types/location';
import { normalizeServiceRadiusMiles } from '../constants/serviceRadius';
import type { PrimaryServiceArea } from '../types/primaryServiceArea';
import {
  formatServiceCoverageLabel,
  isServiceCoverageDirty,
  primaryServiceAreaToStructuredLocation,
  structuredLocationToPrimaryServiceArea,
  toPublicServiceCoverage,
  validateServiceCoverage,
} from '../utils/primaryServiceArea';

const austin: StructuredLocation = {
  providerId: 'place-1',
  label: 'Austin, Texas, United States',
  searchValue: 'Austin, Texas, United States',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  latitude: 30.2672,
  longitude: -97.7431,
  placeType: 'place',
};

const savedArea: PrimaryServiceArea = {
  id: 'area-1',
  label: 'Austin, Texas, United States',
  city: 'Austin',
  stateCode: 'TX',
  postalCode: '78701',
  latitude: 30.2672,
  longitude: -97.7431,
  radiusMiles: 25,
  placeType: 'place',
  providerPlaceId: 'place-1',
};

describe('formatServiceCoverageLabel', () => {
  it('includes city, state, and radius', () => {
    expect(formatServiceCoverageLabel('Austin', 'TX', 25)).toBe(
      'Austin, TX · 25 mi'
    );
  });

  it('omits radius when missing', () => {
    expect(formatServiceCoverageLabel('Austin', 'TX', null)).toBe('Austin, TX');
  });

  it('returns null when empty', () => {
    expect(formatServiceCoverageLabel('', '', 25)).toBeNull();
  });
});

describe('validateServiceCoverage', () => {
  it('requires a confirmed suggestion', () => {
    expect(validateServiceCoverage(null, 25)).toEqual([
      'Choose a suggested location to confirm it',
    ]);
  });

  it('accepts a MapTiler pick and radius', () => {
    expect(validateServiceCoverage(austin, 25)).toEqual([]);
  });
});

describe('isServiceCoverageDirty', () => {
  it('is clean when location and radius match', () => {
    expect(
      isServiceCoverageDirty(
        { location: austin, radiusMiles: 25 },
        { location: austin, radiusMiles: 25 }
      )
    ).toBe(false);
  });

  it('is dirty when only radius changes', () => {
    expect(
      isServiceCoverageDirty(
        { location: austin, radiusMiles: 25 },
        { location: austin, radiusMiles: 40 }
      )
    ).toBe(true);
  });
});

describe('primaryServiceArea mapping', () => {
  it('round-trips without exposing extra public fields', () => {
    const location = primaryServiceAreaToStructuredLocation(savedArea);
    expect(location.city).toBe('Austin');
    expect(location.latitude).toBe(30.2672);

    const publicCoverage = toPublicServiceCoverage(savedArea);
    expect(publicCoverage).toEqual({
      city: 'Austin',
      stateCode: 'TX',
      postalCode: '78701',
      radiusMiles: 25,
      label: 'Austin, Texas, United States',
    });
    expect(publicCoverage).not.toHaveProperty('latitude');

    const rebuilt = structuredLocationToPrimaryServiceArea(
      location,
      30,
      'area-1'
    );
    expect(rebuilt.radiusMiles).toBe(30);
    expect(rebuilt.id).toBe('area-1');
  });
});

describe('normalizeServiceRadiusMiles', () => {
  it('snaps to the nearest option', () => {
    expect(normalizeServiceRadiusMiles(22)).toBe(20);
    expect(normalizeServiceRadiusMiles(25)).toBe(25);
  });
});
