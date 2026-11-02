import { afterEach, describe, expect, it } from 'vitest';
import {
  clearPublicBookingPolicyAgreementMemory,
  hasAgreedToPublicBookingPolicy,
  markPublicBookingPolicyAgreed,
} from '../utils/bookingPolicyAgreementMemory';

describe('bookingPolicyAgreementMemory', () => {
  afterEach(() => {
    clearPublicBookingPolicyAgreementMemory();
  });

  it('remembers agree for this page load only, keyed by slug', () => {
    expect(hasAgreedToPublicBookingPolicy('acme-detail')).toBe(false);
    markPublicBookingPolicyAgreed('acme-detail');
    expect(hasAgreedToPublicBookingPolicy('acme-detail')).toBe(true);
    expect(hasAgreedToPublicBookingPolicy('other-shop')).toBe(false);
  });

  it('ignores a blank slug', () => {
    markPublicBookingPolicyAgreed('  ');
    expect(hasAgreedToPublicBookingPolicy('  ')).toBe(false);
  });
});
