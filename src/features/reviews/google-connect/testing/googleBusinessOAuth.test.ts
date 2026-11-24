import { afterEach, describe, expect, it } from 'vitest';
import {
  buildGoogleBusinessAuthorizeUrl,
  getGoogleBusinessOAuthConfig,
  GOOGLE_BUSINESS_MANAGE_SCOPE,
} from '../server/googleBusinessOAuth';

const originalClientId = process.env.GOOGLE_BUSINESS_CLIENT_ID;
const originalClientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET;

describe('googleBusinessOAuth', () => {
  afterEach(() => {
    if (originalClientId === undefined) {
      delete process.env.GOOGLE_BUSINESS_CLIENT_ID;
    } else {
      process.env.GOOGLE_BUSINESS_CLIENT_ID = originalClientId;
    }
    if (originalClientSecret === undefined) {
      delete process.env.GOOGLE_BUSINESS_CLIENT_SECRET;
    } else {
      process.env.GOOGLE_BUSINESS_CLIENT_SECRET = originalClientSecret;
    }
  });

  it('builds an offline consent URL with the business.manage scope', () => {
    const url = new URL(
      buildGoogleBusinessAuthorizeUrl({
        clientId: 'client-1',
        redirectUri: 'http://localhost:3000/api/reviews/google/callback',
        state: 'signed-state',
      })
    );

    expect(url.origin + url.pathname).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth'
    );
    expect(url.searchParams.get('client_id')).toBe('client-1');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3000/api/reviews/google/callback'
    );
    expect(url.searchParams.get('scope')).toBe(GOOGLE_BUSINESS_MANAGE_SCOPE);
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('prompt')).toBe('consent');
    expect(url.searchParams.get('state')).toBe('signed-state');
  });

  it('requires both Google Business env vars', () => {
    delete process.env.GOOGLE_BUSINESS_CLIENT_ID;
    delete process.env.GOOGLE_BUSINESS_CLIENT_SECRET;
    expect(getGoogleBusinessOAuthConfig()).toBeNull();

    process.env.GOOGLE_BUSINESS_CLIENT_ID = 'id';
    expect(getGoogleBusinessOAuthConfig()).toBeNull();

    process.env.GOOGLE_BUSINESS_CLIENT_SECRET = 'secret';
    expect(getGoogleBusinessOAuthConfig()).toEqual({
      clientId: 'id',
      clientSecret: 'secret',
    });
  });
});
