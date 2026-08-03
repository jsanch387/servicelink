import { describe, expect, it, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { resolveAccountEmailChangeRedirectTo } from '../server/resolveAccountEmailChangeRedirectTo';

describe('resolveAccountEmailChangeRedirectTo', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    vi.unstubAllEnvs();
  });

  it('prefers an allowlisted client origin (localhost)', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://myservicelink.app';
    const req = new NextRequest('http://localhost:3000/api/account', {
      method: 'PATCH',
    });

    const redirectTo = resolveAccountEmailChangeRedirectTo(
      req,
      'http://localhost:3000'
    );
    const parsed = new URL(redirectTo);

    expect(parsed.origin).toBe('http://localhost:3000');
    expect(parsed.pathname).toBe('/auth/callback');
    expect(parsed.searchParams.get('next')).toBe('/dashboard/settings');
    expect(parsed.searchParams.get('email_notice')).toBe('updated');
  });

  it('ignores a non-allowlisted client origin', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://myservicelink.app';
    const req = new NextRequest('https://myservicelink.app/api/account', {
      method: 'PATCH',
      headers: { host: 'myservicelink.app', 'x-forwarded-proto': 'https' },
    });

    const redirectTo = resolveAccountEmailChangeRedirectTo(
      req,
      'https://evil.example'
    );

    expect(
      redirectTo.startsWith('https://myservicelink.app/auth/callback?')
    ).toBe(true);
  });
});
