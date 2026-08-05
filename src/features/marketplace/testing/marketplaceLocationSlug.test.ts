import {
  isCuratedMarketplaceCitySlug,
  locationToMarketplaceSlug,
  resolveMarketplaceCityFromSlug,
} from '@/features/marketplace/utils/marketplaceLocationSlug';
import { parseMarketplaceLocation } from '@/features/marketplace/utils/parseMarketplaceLocation';
import { describe, expect, it } from 'vitest';

describe('parseMarketplaceLocation', () => {
  it('parses city and state', () => {
    expect(parseMarketplaceLocation('Los Angeles, CA')).toEqual({
      display: 'Los Angeles, CA',
      city: 'los angeles',
      state: 'CA',
      zip: null,
    });
  });

  it('parses ZIP-only queries', () => {
    expect(parseMarketplaceLocation('78701')).toEqual({
      display: '78701',
      city: null,
      state: null,
      zip: '78701',
    });
  });
});

describe('locationToMarketplaceSlug', () => {
  it('uses curated slugs for Austin-area cities', () => {
    expect(locationToMarketplaceSlug('Austin, TX')).toBe('austin-tx');
    expect(locationToMarketplaceSlug('Round Rock')).toBe('round-rock-tx');
  });

  it('builds dynamic slugs for any city', () => {
    expect(locationToMarketplaceSlug('Los Angeles, CA')).toBe(
      'los-angeles-ca'
    );
    expect(locationToMarketplaceSlug('Los Angeles')).toBe('los-angeles');
    expect(locationToMarketplaceSlug('78701')).toBe('78701');
  });

  it('rejects empty / invalid input', () => {
    expect(locationToMarketplaceSlug('')).toBeNull();
    expect(locationToMarketplaceSlug('current location')).toBeNull();
  });
});

describe('resolveMarketplaceCityFromSlug', () => {
  it('resolves curated and dynamic city pages', () => {
    expect(resolveMarketplaceCityFromSlug('austin-tx')).toMatchObject({
      slug: 'austin-tx',
      displayName: 'Austin, TX',
      searchQuery: 'Austin, TX',
    });
    expect(resolveMarketplaceCityFromSlug('los-angeles-ca')).toMatchObject({
      slug: 'los-angeles-ca',
      name: 'Los Angeles',
      stateCode: 'CA',
      displayName: 'Los Angeles, CA',
      searchQuery: 'Los Angeles, CA',
    });
    expect(resolveMarketplaceCityFromSlug('78701')).toMatchObject({
      slug: '78701',
      displayName: '78701',
      searchQuery: '78701',
    });
  });

  it('rejects invalid slugs', () => {
    expect(resolveMarketplaceCityFromSlug('')).toBeNull();
    expect(resolveMarketplaceCityFromSlug('Los Angeles')).toBeNull();
    expect(resolveMarketplaceCityFromSlug('../etc')).toBeNull();
  });

  it('detects curated slugs', () => {
    expect(isCuratedMarketplaceCitySlug('austin-tx')).toBe(true);
    expect(isCuratedMarketplaceCitySlug('los-angeles-ca')).toBe(false);
  });
});
