import { buildMaintenanceInviteCustomerUrl } from '@/features/maintenance/utils/buildMaintenanceInviteCustomerUrl';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('[Maintenance] buildMaintenanceInviteCustomerUrl', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    vi.unstubAllGlobals();
  });

  it('returns empty string for blank token', () => {
    expect(buildMaintenanceInviteCustomerUrl('')).toBe('');
    expect(buildMaintenanceInviteCustomerUrl('   ')).toBe('');
  });

  it('uses window origin when available', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://app.example.com' },
    });
    const url = buildMaintenanceInviteCustomerUrl('tok_one');
    expect(url).toBe('https://app.example.com/maintenance/e/tok_one');
  });

  it('falls back to NEXT_PUBLIC_SITE_URL without trailing slash', () => {
    vi.stubGlobal('window', undefined);
    process.env.NEXT_PUBLIC_SITE_URL = 'https://mysite.app/';
    const url = buildMaintenanceInviteCustomerUrl('abc-123');
    expect(url).toBe('https://mysite.app/maintenance/e/abc-123');
  });

  it('returns path only when no base URL', () => {
    vi.stubGlobal('window', { location: { origin: '' } } as Window & typeof globalThis);
    process.env.NEXT_PUBLIC_SITE_URL = '';
    const url = buildMaintenanceInviteCustomerUrl('x');
    expect(url).toBe('/maintenance/e/x');
  });
});
