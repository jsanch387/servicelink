import { afterEach, describe, expect, it } from 'vitest';
import { GOOGLE_CONNECT_STATE_COOKIE } from '../server/googleBusinessOAuth';
import { startGoogleBusinessConnect } from '../server/startGoogleBusinessConnect';

const originalClientId = process.env.GOOGLE_BUSINESS_CLIENT_ID;
const originalClientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET;
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

describe('startGoogleBusinessConnect', () => {
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
    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }
  });

  it('returns a configuration error when env is missing', () => {
    delete process.env.GOOGLE_BUSINESS_CLIENT_ID;
    delete process.env.GOOGLE_BUSINESS_CLIENT_SECRET;
    const result = startGoogleBusinessConnect({
      request: new Request('http://localhost:3000/api/reviews/google/connect'),
      userId: 'user-1',
      businessId: 'biz-1',
    });

    expect(result).toEqual({
      ok: false,
      status: 500,
      error: 'Google Business is not configured.',
    });
  });

  it('returns a Google authorize URL and state cookie', () => {
    process.env.GOOGLE_BUSINESS_CLIENT_ID = 'client-1';
    process.env.GOOGLE_BUSINESS_CLIENT_SECRET = 'secret-1';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    const result = startGoogleBusinessConnect({
      request: new Request('http://localhost:3000/api/reviews/google/connect'),
      userId: 'user-1',
      businessId: 'biz-1',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const url = new URL(result.url);
    expect(url.searchParams.get('client_id')).toBe('client-1');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3000/api/reviews/google/callback'
    );
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(result.cookie.name).toBe(GOOGLE_CONNECT_STATE_COOKIE);
    expect(result.cookie.httpOnly).toBe(true);
    expect(result.cookie.value.length).toBeGreaterThan(8);
  });
});
