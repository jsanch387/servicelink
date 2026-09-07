import { describe, expect, it } from 'vitest';

import { AUTH_REDIRECT_ATTRIBUTION_PARAM } from '../constants';
import {
  appendAttributionToAuthRedirect,
  decodeAttributionFromRedirect,
  encodeAttributionForRedirect,
} from '../utils/authRedirectAttribution';

describe('authRedirectAttribution', () => {
  it('round-trips first-touch through the OAuth redirect param', () => {
    const encoded = encodeAttributionForRedirect({
      landingPath: '/',
      utmSource: 'meta',
      utmMedium: 'paid',
      utmCampaign: 'sep-test',
      utmContent: 'hook-a',
      fbclid: 'abc123',
    });

    expect(encoded).toBeTruthy();
    const decoded = decodeAttributionFromRedirect(encoded);
    expect(decoded?.utmSource).toBe('meta');
    expect(decoded?.utmContent).toBe('hook-a');
    expect(decoded?.fbclid).toBe('abc123');
  });

  it('appends sl_attr to the auth callback URL', () => {
    const url = appendAttributionToAuthRedirect(
      'https://myservicelink.app/auth/callback',
      { utmSource: 'meta', fbclid: 'xyz' }
    );
    const parsed = new URL(url);
    expect(
      parsed.searchParams.get(AUTH_REDIRECT_ATTRIBUTION_PARAM)
    ).toBeTruthy();
    expect(
      decodeAttributionFromRedirect(
        parsed.searchParams.get(AUTH_REDIRECT_ATTRIBUTION_PARAM)
      )?.fbclid
    ).toBe('xyz');
  });

  it('does not invent Meta attribution from an empty payload', () => {
    expect(encodeAttributionForRedirect({})).toBeNull();
    expect(decodeAttributionFromRedirect('not-valid')).toBeNull();
  });
});
