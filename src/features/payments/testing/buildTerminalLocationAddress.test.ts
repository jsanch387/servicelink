import { buildTerminalLocationAddress } from '@/features/payments/server/buildTerminalLocationAddress';
import { describe, expect, it } from 'vitest';

describe('buildTerminalLocationAddress', () => {
  it('prefers a complete address from the Stripe Connect account', () => {
    const address = buildTerminalLocationAddress(
      { business_name: 'Acme', service_area: 'Austin, TX' },
      {
        id: 'acct_test',
        object: 'account',
        company: {
          address: {
            line1: '123 Main St',
            city: 'Austin',
            state: 'TX',
            postal_code: '78701',
            country: 'US',
          },
        },
      } as never
    );

    expect(address).toEqual({
      line1: '123 Main St',
      city: 'Austin',
      state: 'TX',
      country: 'US',
      postal_code: '78701',
    });
  });

  it('falls back to service area and US defaults when Stripe has no address', () => {
    const address = buildTerminalLocationAddress(
      { business_name: 'Mobile Detail Co', service_area: 'Miami, FL' },
      null
    );

    expect(address).toEqual({
      line1: 'Mobile Detail Co',
      city: 'Miami',
      state: 'FL',
      country: 'US',
      postal_code: '90001',
    });
  });

  it('uses generic defaults when profile data is sparse', () => {
    const address = buildTerminalLocationAddress(
      { business_name: '', service_area: null },
      null
    );

    expect(address.line1).toBe('ServiceLink business');
    expect(address.city).toBe('Los Angeles');
    expect(address.state).toBe('CA');
    expect(address.country).toBe('US');
    expect(address.postal_code).toBe('90001');
  });
});
