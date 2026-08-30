import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bookingPolicyAgreedStorageKey,
  hasAgreedToPublicBookingPolicy,
  markPublicBookingPolicyAgreed,
} from '../utils/bookingPolicyAgreementStorage';

describe('bookingPolicyAgreementStorage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'sessionStorage',
      (() => {
        const store = new Map<string, string>();
        return {
          getItem: (k: string) => store.get(k) ?? null,
          setItem: (k: string, v: string) => {
            store.set(k, v);
          },
          removeItem: (k: string) => {
            store.delete(k);
          },
        };
      })()
    );
  });

  it('keys agreement by business slug', () => {
    expect(bookingPolicyAgreedStorageKey('acme-detail')).toBe(
      'booking-policy-agreed:acme-detail'
    );
  });

  it('starts unset and remembers agree for this visit', () => {
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
