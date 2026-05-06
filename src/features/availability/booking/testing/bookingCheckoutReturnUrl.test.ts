import { buildBookPageCheckoutReturnUrl } from '@/features/availability/booking/utils/bookingCheckoutReturnUrl';
import { describe, expect, it } from 'vitest';

describe('buildBookPageCheckoutReturnUrl', () => {
  it('appends literal session_id placeholder for Stripe (must not be URL-encoded)', () => {
    const url = buildBookPageCheckoutReturnUrl({
      baseUrl: 'https://app.example.com',
      businessSlug: 'acme-auto',
      checkout: 'success',
    });
    expect(url).toContain('session_id={CHECKOUT_SESSION_ID}');
    expect(url).not.toContain('%7B');
    expect(url).not.toContain('%7D');
  });

  it('forwards only whitelisted resume params on success', () => {
    const url = buildBookPageCheckoutReturnUrl({
      baseUrl: 'https://app.example.com',
      businessSlug: 'acme-auto',
      checkout: 'success',
      resumeQuery:
        'serviceId=svc-1&priceOptionId=p1&evil=javascript:alert(1)&addOnIds=a,b',
    });
    expect(url).toContain('serviceId=svc-1');
    expect(url).toContain('priceOptionId=p1');
    expect(url).toContain('addOnIds=a%2Cb');
    expect(url).not.toContain('evil');
  });

  it('does not append session_id placeholder for cancel', () => {
    const url = buildBookPageCheckoutReturnUrl({
      baseUrl: 'https://app.example.com',
      businessSlug: 'acme-auto',
      checkout: 'cancel',
    });
    expect(url).toContain('checkout=cancel');
    expect(url).not.toContain('CHECKOUT_SESSION_ID');
  });

  it('forwards funnel lang on success return (Stripe resume whitelist)', () => {
    const url = buildBookPageCheckoutReturnUrl({
      baseUrl: 'https://app.example.com',
      businessSlug: 'acme-auto',
      checkout: 'success',
      resumeQuery: 'serviceId=svc-1&lang=es',
    });
    expect(url).toContain('lang=es');
    expect(url).toContain('serviceId=svc-1');
  });
});
