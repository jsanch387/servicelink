import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import {
  affonsoReferralFromRequest,
  resolveAffonsoReferral,
  withAffonsoCheckoutMetadata,
} from '../server/affonsoCheckoutMetadata';

describe('affonsoCheckoutMetadata', () => {
  it('reads the affonso_referral cookie', () => {
    const request = new NextRequest('https://myservicelink.app/api/stripe', {
      headers: { cookie: 'affonso_referral=ref_abc123; other=1' },
    });
    expect(affonsoReferralFromRequest(request)).toBe('ref_abc123');
  });

  it('returns empty when the cookie is missing', () => {
    const request = new NextRequest('https://myservicelink.app/api/stripe');
    expect(affonsoReferralFromRequest(request)).toBe('');
  });

  it('prefers the cookie over a client-sent referral', () => {
    const request = new NextRequest('https://myservicelink.app/api/stripe', {
      headers: { cookie: 'affonso_referral=from_cookie' },
    });
    expect(resolveAffonsoReferral(request, 'from_body')).toBe('from_cookie');
  });

  it('falls back to the client-sent referral when the cookie is missing', () => {
    const request = new NextRequest('https://myservicelink.app/api/stripe');
    expect(resolveAffonsoReferral(request, 'from_body')).toBe('from_body');
  });

  it('adds affonso_referral to Stripe metadata', () => {
    expect(
      withAffonsoCheckoutMetadata({ userId: 'u1', source: 'upgrade' }, 'ref_1')
    ).toEqual({
      userId: 'u1',
      source: 'upgrade',
      affonso_referral: 'ref_1',
    });
  });

  it('still includes the affonso_referral key when there is no referral', () => {
    expect(
      withAffonsoCheckoutMetadata({ userId: 'u1', source: 'upgrade' }, '')
    ).toEqual({
      userId: 'u1',
      source: 'upgrade',
      affonso_referral: '',
    });
  });
});
