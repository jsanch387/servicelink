import { describe, expect, it } from 'vitest';
import { customerSmsOptedIn } from '../utils/customerSmsOptIn';

describe('customerSmsOptedIn', () => {
  it('defaults to opted in', () => {
    expect(customerSmsOptedIn(null)).toBe(true);
    expect(customerSmsOptedIn(undefined)).toBe(true);
    expect(customerSmsOptedIn(true)).toBe(true);
    expect(customerSmsOptedIn('true')).toBe(true);
  });

  it('treats false as opted out', () => {
    expect(customerSmsOptedIn(false)).toBe(false);
    expect(customerSmsOptedIn('false')).toBe(false);
  });
});
