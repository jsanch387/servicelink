import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';
import { afterEach, describe, expect, it } from 'vitest';

describe('getAppBaseUrl', () => {
  const original = {
    SITE_URL: process.env.SITE_URL,
    APP_URL: process.env.APP_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  afterEach(() => {
    restoreEnv('SITE_URL', original.SITE_URL);
    restoreEnv('APP_URL', original.APP_URL);
    restoreEnv('NEXT_PUBLIC_SITE_URL', original.NEXT_PUBLIC_SITE_URL);
    restoreEnv('NEXT_PUBLIC_APP_URL', original.NEXT_PUBLIC_APP_URL);
    restoreEnv('NODE_ENV', original.NODE_ENV);
  });

  function restoreEnv(key: string, value: string | undefined) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  function requestWithHost(host: string, proto = 'https'): Request {
    return new Request(
      'https://example.invalid/api/public/memberships/portal',
      {
        headers: {
          host,
          'x-forwarded-host': host,
          'x-forwarded-proto': proto,
        },
      }
    );
  }

  it('uses the request host for a real domain', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://myservicelink.app';
    expect(getAppBaseUrl(requestWithHost('myservicelink.app'))).toBe(
      'https://myservicelink.app'
    );
  });

  it('uses localhost from the request in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://myservicelink.app';
    expect(getAppBaseUrl(requestWithHost('localhost:3000', 'http'))).toBe(
      'http://localhost:3000'
    );
  });

  it('does not send customers to a Vercel preview host', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://myservicelink.app';
    expect(
      getAppBaseUrl(
        requestWithHost('servicelink-h11otc121-jsanch387s-projects.vercel.app')
      )
    ).toBe('https://myservicelink.app');
  });

  it('falls back to myservicelink.app when preview host has no canonical env', () => {
    delete process.env.SITE_URL;
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.NODE_ENV = 'production';
    expect(
      getAppBaseUrl(requestWithHost('servicelink-preview.vercel.app'))
    ).toBe('https://myservicelink.app');
  });
});
