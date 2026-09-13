import { describe, expect, it } from 'vitest';
import {
  geocodingTypesForMode,
  mapGeocodingFeature,
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

describe('mapGeocodingFeature', () => {
  it('still maps a US city to its state abbreviation', () => {
    const location = mapGeocodingFeature({
      id: 'municipality.273798',
      text: 'San Juan',
      place_name: 'San Juan, Texas, United States',
      place_type: ['municipality'],
      center: [-98.15528735518456, 26.189241156890592],
      context: [
        { id: 'county.23414', text: 'Hidalgo' },
        { id: 'region.2176', text: 'Texas' },
        { id: 'country.213', text: 'United States' },
      ],
    });

    expect(location).toMatchObject({
      city: 'San Juan',
      state: 'TX',
      label: 'San Juan, TX',
    });
  });

  it('lets a user confirm San Juan, Puerto Rico', () => {
    const location = mapGeocodingFeature({
      id: 'place.5130871',
      text: 'San Juan',
      place_name: 'San Juan, San Juan, Puerto Rico, United States',
      place_type: ['place'],
      center: [-66.11666612327099, 18.46529931126442],
      context: [
        { id: 'county.24535', text: 'San Juan' },
        { id: 'region.2244', text: 'Puerto Rico' },
        { id: 'country.213', text: 'United States' },
      ],
    });

    expect(location).toMatchObject({
      city: 'San Juan',
      state: 'PR',
      label: 'San Juan, PR',
    });
  });
});
