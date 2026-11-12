import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearPublicBookingPolicyAgreementMemory,
  hasAgreedToPublicBookingPolicy,
  markPublicBookingPolicyAgreed,
} from '../utils/bookingPolicyAgreementMemory';

describe('bookingPolicyAgreementMemory', () => {
  afterEach(() => {
    clearPublicBookingPolicyAgreementMemory();
  });

  it('remembers agree for this tab, keyed by slug', () => {
    expect(hasAgreedToPublicBookingPolicy('acme-detail')).toBe(false);
    markPublicBookingPolicyAgreed('acme-detail');
    expect(hasAgreedToPublicBookingPolicy('acme-detail')).toBe(true);
    expect(hasAgreedToPublicBookingPolicy('other-shop')).toBe(false);
  });

  it('keeps the agreement after a reload in the same tab', async () => {
    const first = await import('../utils/bookingPolicyAgreementMemory');
    first.markPublicBookingPolicyAgreed('acme-detail');
    vi.resetModules();
    const next = await import('../utils/bookingPolicyAgreementMemory');
    expect(next.hasAgreedToPublicBookingPolicy('acme-detail')).toBe(true);
    expect(next.hasAgreedToPublicBookingPolicy('other-shop')).toBe(false);
    next.clearPublicBookingPolicyAgreementMemory();
  });

  it('ignores a blank slug', () => {
    markPublicBookingPolicyAgreed('  ');
    expect(hasAgreedToPublicBookingPolicy('  ')).toBe(false);
  });
});
