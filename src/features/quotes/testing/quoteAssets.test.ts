import { describe, expect, it } from 'vitest';
import {
  buildQuoteAssets,
  extraQuoteAssetHeading,
  formatQuoteAssetsCardDisplay,
  mergeQuoteAssetsPreservingExtra,
  normalizeQuoteAssets,
  primaryVehicleFieldsFromQuote,
  quoteAssetFromDisplayLine,
  quoteAssetsSectionHeading,
  replaceQuoteVehicleAssets,
  takeFirstExtraVehicle,
} from '@/features/quotes/shared/quoteAssets';

describe('quoteAssets', () => {
  it('builds vehicles as typed assets', () => {
    expect(
      buildQuoteAssets(
        { year: '2017', make: 'Toyota', model: 'Tacoma' },
        { year: '2018', make: 'Honda', model: 'Civic' }
      )
    ).toEqual([
      {
        type: 'vehicle',
        label: '2017 Toyota Tacoma',
        attributes: { year: '2017', make: 'Toyota', model: 'Tacoma' },
      },
      {
        type: 'vehicle',
        label: '2018 Honda Civic',
        attributes: { year: '2018', make: 'Honda', model: 'Civic' },
      },
    ]);
  });

  it('keeps extra assets when the owner edits the first vehicle', () => {
    expect(
      mergeQuoteAssetsPreservingExtra(
        [
          {
            type: 'vehicle',
            label: '2017 Toyota Tacoma',
            attributes: { year: '2017', make: 'Toyota', model: 'Tacoma' },
          },
          {
            type: 'pet',
            label: 'Buddy · Lab · Dog · Large',
            attributes: {
              name: 'Buddy',
              species: 'Dog',
              breed: 'Lab',
              size: 'Large',
            },
          },
        ],
        { year: '2020', make: 'Toyota', model: 'Tundra' }
      )
    ).toEqual([
      {
        type: 'vehicle',
        label: '2020 Toyota Tundra',
        attributes: { year: '2020', make: 'Toyota', model: 'Tundra' },
      },
      {
        type: 'pet',
        label: 'Buddy · Lab · Dog · Large',
        attributes: {
          name: 'Buddy',
          species: 'Dog',
          breed: 'Lab',
          size: 'Large',
        },
      },
    ]);
  });

  it('accepts legacy year/make/model rows', () => {
    expect(
      normalizeQuoteAssets([{ year: '2021', make: 'Tesla', model: 'Model 3' }])
    ).toEqual([
      {
        type: 'vehicle',
        label: '2021 Tesla Model 3',
        attributes: { year: '2021', make: 'Tesla', model: 'Model 3' },
      },
    ]);
  });

  it('parses a leftover second-vehicle note line', () => {
    expect(quoteAssetFromDisplayLine('2018 Honda Civic')).toEqual({
      type: 'vehicle',
      label: '2018 Honda Civic',
      attributes: { year: '2018', make: 'Honda', model: 'Civic' },
    });
  });

  it('hydrates car 1 from assets when columns are empty', () => {
    expect(
      primaryVehicleFieldsFromQuote({
        vehicleYear: null,
        vehicleMake: null,
        vehicleModel: null,
        assets: [
          {
            type: 'vehicle',
            label: '2021 Tesla Model 3',
            attributes: { year: '2021', make: 'Tesla', model: 'Model 3' },
          },
        ],
      })
    ).toEqual({ year: '2021', make: 'Tesla', model: 'Model 3' });
  });

  it('replaces vehicles and keeps pets', () => {
    expect(
      replaceQuoteVehicleAssets(
        [
          {
            type: 'vehicle',
            label: '2017 Toyota Tacoma',
            attributes: { year: '2017', make: 'Toyota', model: 'Tacoma' },
          },
          {
            type: 'pet',
            label: 'Buddy',
            attributes: { name: 'Buddy', species: 'Dog' },
          },
        ],
        { year: '2020', make: 'Toyota', model: 'Tundra' },
        { year: '2018', make: 'Honda', model: 'Civic' }
      )
    ).toEqual([
      {
        type: 'vehicle',
        label: '2020 Toyota Tundra',
        attributes: { year: '2020', make: 'Toyota', model: 'Tundra' },
      },
      {
        type: 'vehicle',
        label: '2018 Honda Civic',
        attributes: { year: '2018', make: 'Honda', model: 'Civic' },
      },
      {
        type: 'pet',
        label: 'Buddy',
        attributes: { name: 'Buddy', species: 'Dog' },
      },
    ]);
  });

  it('splits the first extra vehicle for the owner form', () => {
    expect(
      takeFirstExtraVehicle([
        {
          type: 'vehicle',
          label: '2018 Honda Civic',
          attributes: { year: '2018', make: 'Honda', model: 'Civic' },
        },
        {
          type: 'pet',
          label: 'Buddy',
          attributes: { name: 'Buddy' },
        },
      ])
    ).toEqual({
      vehicle: { year: '2018', make: 'Honda', model: 'Civic' },
      remaining: [
        {
          type: 'pet',
          label: 'Buddy',
          attributes: { name: 'Buddy' },
        },
      ],
    });
  });

  it('adds +1 on the card line when there is a second vehicle', () => {
    expect(
      formatQuoteAssetsCardDisplay([
        {
          type: 'vehicle',
          label: '2018 Toyota Tacoma',
          attributes: { year: '2018', make: 'Toyota', model: 'Tacoma' },
        },
        {
          type: 'vehicle',
          label: '2017 Honda Civic',
          attributes: { year: '2017', make: 'Honda', model: 'Civic' },
        },
      ])
    ).toBe('2018 Toyota Tacoma +1');
  });

  it('labels extra items by type', () => {
    expect(
      extraQuoteAssetHeading({ type: 'pet', label: 'Buddy', attributes: {} }, 0)
    ).toBe('Second pet');
    expect(
      quoteAssetsSectionHeading([
        { type: 'pet', label: 'Buddy', attributes: {} },
      ])
    ).toBe('Pet');
  });
});
