import { describe, expect, it } from 'vitest';
import {
  geocodingTypesForMode,
  streetLineFromGeocodingFeature,
} from '../api/mapTilerGeocoding';

describe('geocodingTypesForMode', () => {
  it('searches streets for shop address mode', () => {
    expect(geocodingTypesForMode('street-address')).toBe('address');
  });

  it('keeps city and ZIP types for coverage search', () => {
    expect(geocodingTypesForMode('service-origin')).toBe(
      'place,municipality,locality,postal_code'
    );
    expect(geocodingTypesForMode('customer-search')).toBe(
      'place,municipality,locality,postal_code'
    );
  });
});

describe('streetLineFromGeocodingFeature', () => {
  it('joins house number and street name', () => {
    expect(
      streetLineFromGeocodingFeature({
        address: '410',
        text: 'East Pecan Street',
        place_type: ['address'],
      })
    ).toBe('410 East Pecan Street');
  });

  it('does not duplicate a house number already in the name', () => {
    expect(
      streetLineFromGeocodingFeature({
        address: '410',
        text: '410 East Pecan Street',
        place_type: ['address'],
      })
    ).toBe('410 East Pecan Street');
  });

  it('returns empty for city picks', () => {
    expect(
      streetLineFromGeocodingFeature({
        text: 'Austin',
        place_type: ['place'],
      })
    ).toBe('');
  });
});
