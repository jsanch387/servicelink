import { describe, expect, it } from 'vitest';
import {
  BOOKING_REFERRAL_QUERY,
  getPublicBusinessProfilePath,
} from '@/constants/routes';
import { MARKETPLACE_BOOKING_REFERRAL_SOURCE } from '../constants';
import {
  decodeBookingReferralCookie,
  encodeBookingReferralCookie,
  parseBookingReferralSource,
} from '../utils/bookingReferralCookieValue';

describe('parseBookingReferralSource', () => {
  it('accepts known channels regardless of casing', () => {
    expect(parseBookingReferralSource('marketplace')).toBe('marketplace');
    expect(parseBookingReferralSource(' MarketPlace ')).toBe('marketplace');
  });

  it('drops unknown or non-string values', () => {
    expect(parseBookingReferralSource('facebook')).toBeNull();
    expect(parseBookingReferralSource('')).toBeNull();
    expect(parseBookingReferralSource(undefined)).toBeNull();
    expect(parseBookingReferralSource(42)).toBeNull();
  });
});

describe('booking referral cookie value', () => {
  it('round-trips source and slug', () => {
    const value = encodeBookingReferralCookie('marketplace', 'Acme-Auto');
    expect(value).toBe('marketplace:acme-auto');
    expect(decodeBookingReferralCookie(value)).toEqual({
      source: 'marketplace',
      businessSlug: 'acme-auto',
    });
  });

  it('rejects malformed or unknown values', () => {
    expect(decodeBookingReferralCookie(undefined)).toBeNull();
    expect(decodeBookingReferralCookie('marketplace')).toBeNull();
    expect(decodeBookingReferralCookie('marketplace:')).toBeNull();
    expect(decodeBookingReferralCookie(':acme-auto')).toBeNull();
    expect(decodeBookingReferralCookie('facebook:acme-auto')).toBeNull();
  });
});

describe('getPublicBusinessProfilePath with ref', () => {
  it('tags marketplace links', () => {
    expect(
      getPublicBusinessProfilePath('acme-auto', {
        ref: MARKETPLACE_BOOKING_REFERRAL_SOURCE,
      })
    ).toBe(`/acme-auto?${BOOKING_REFERRAL_QUERY}=marketplace`);
  });

  it('keeps lang alongside ref', () => {
    expect(
      getPublicBusinessProfilePath('acme-auto', {
        lang: 'es',
        ref: MARKETPLACE_BOOKING_REFERRAL_SOURCE,
      })
    ).toBe(`/acme-auto?lang=es&${BOOKING_REFERRAL_QUERY}=marketplace`);
  });
});
