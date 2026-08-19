import { describe, expect, it } from 'vitest';
import { membershipCustomerSmsOptedIn } from '../utils/membershipSmsOptIn';

describe('membershipCustomerSmsOptedIn', () => {
  it('defaults to opted in when metadata is missing', () => {
    expect(membershipCustomerSmsOptedIn(null)).toBe(true);
    expect(membershipCustomerSmsOptedIn(undefined)).toBe(true);
    expect(membershipCustomerSmsOptedIn({})).toBe(true);
  });

  it('treats smsOptIn false as opted out', () => {
    expect(membershipCustomerSmsOptedIn({ smsOptIn: 'false' })).toBe(false);
    expect(membershipCustomerSmsOptedIn({ smsOptIn: false })).toBe(false);
  });

  it('treats smsOptIn true as opted in', () => {
    expect(membershipCustomerSmsOptedIn({ smsOptIn: 'true' })).toBe(true);
    expect(membershipCustomerSmsOptedIn({ smsOptIn: true })).toBe(true);
  });
});
