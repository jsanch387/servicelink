import { describe, expect, it } from 'vitest';
import {
  geocodingTypesForMode,
  mapGeocodingFeature,
  streetLineFromGeocodingFeature,
} from '../api/mapTilerGeocoding';
import {
  expandStreetAddressQuery,
  rankStreetAddressSuggestions,
} from '../utils/streetAddressQuery';

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

  it('maps a street when MapTiler omits the house number', () => {
    const location = mapGeocodingFeature({
      id: 'address.120116817',
      text: 'Burkemont Avenue',
      place_name:
        'Burkemont Avenue, Morganton, North Carolina 28655, United States',
      place_type: ['address'],
      center: [-81.674, 35.734],
      context: [
        { id: 'place.4813184', text: 'Magnolia' },
        { id: 'municipality.267150', text: 'Morganton' },
        { id: 'region.2112', text: 'North Carolina' },
        { id: 'postal_code.3425057', text: '28655' },
        { id: 'country.213', text: 'United States' },
      ],
    });

    expect(location).toMatchObject({
      street: 'Burkemont Avenue',
      city: 'Morganton',
      state: 'NC',
      zip: '28655',
      label: 'Burkemont Avenue, Morganton, NC 28655',
    });
  });
});

describe('street address suggestions', () => {
  it('expands interstate shorthand for a second search', () => {
    expect(expandStreetAddressQuery('14301 N IH 35')).toBe(
      '14301 North Interstate 35'
    );
  });

  it('keeps the typed house number on a street MapTiler returned without one', () => {
    const ranked = rankStreetAddressSuggestions('1025 Burkemont Avenue', [
      {
        providerId: 'address.vermont',
        label: 'Avenue, Bakersfield, VT 05441',
        searchValue: 'Avenue, Bakersfield, VT 05441',
        city: 'Bakersfield',
        state: 'VT',
        zip: '05441',
        street: 'Avenue',
        latitude: 44.98,
        longitude: -72.8,
        placeType: 'address',
      },
      {
        providerId: 'address.burkemont',
        label: 'Burkemont Avenue, Morganton, NC 28655',
        searchValue: 'Burkemont Avenue, Morganton, NC 28655',
        city: 'Morganton',
        state: 'NC',
        zip: '28655',
        street: 'Burkemont Avenue',
        latitude: 35.73,
        longitude: -81.67,
        placeType: 'address',
      },
    ]);

    expect(ranked.map(item => item.label)).toEqual([
      '1025 Burkemont Avenue, Morganton, NC 28655',
    ]);
    expect(ranked[0]?.street).toBe('1025 Burkemont Avenue');
  });

  it('prefers the numbered interstate over a service-road alias', () => {
    const ranked = rankStreetAddressSuggestions('14301 N IH 35', [
      {
        providerId: 'address.svrd',
        label: '14301 North Ih 35 Svrd Nb, Austin, TX 78660',
        searchValue: '14301 North Ih 35 Svrd Nb, Austin, TX 78660',
        city: 'Austin',
        state: 'TX',
        zip: '78660',
        street: '14301 North Ih 35 Svrd Nb',
        latitude: 30.4,
        longitude: -97.7,
        placeType: 'address',
      },
      {
        providerId: 'address.interstate',
        label: '14301 North Interstate 35, Austin, TX 78660',
        searchValue: '14301 North Interstate 35, Austin, TX 78660',
        city: 'Austin',
        state: 'TX',
        zip: '78660',
        street: '14301 North Interstate 35',
        latitude: 30.4,
        longitude: -97.7,
        placeType: 'address',
      },
    ]);

    expect(ranked[0]?.label).toBe(
      '14301 North Interstate 35, Austin, TX 78660'
    );
  });

  it('does not stamp a house number onto other cities when one result already has it', () => {
    const ranked = rankStreetAddressSuggestions('14301 N IH 35', [
      {
        providerId: 'address.austin',
        label: '14301 North Interstate 35, Austin, TX 78660',
        searchValue: '14301 North Interstate 35, Austin, TX 78660',
        city: 'Austin',
        state: 'TX',
        zip: '78660',
        street: '14301 North Interstate 35',
        latitude: 30.4,
        longitude: -97.7,
        placeType: 'address',
      },
      {
        providerId: 'address.jarrell',
        label: 'North Interstate 35, Jarrell, TX 76537',
        searchValue: 'North Interstate 35, Jarrell, TX 76537',
        city: 'Jarrell',
        state: 'TX',
        zip: '76537',
        street: 'North Interstate 35',
        latitude: 30.8,
        longitude: -97.6,
        placeType: 'address',
      },
    ]);

    expect(ranked.map(item => item.label)).toEqual([
      '14301 North Interstate 35, Austin, TX 78660',
    ]);
  });
});
