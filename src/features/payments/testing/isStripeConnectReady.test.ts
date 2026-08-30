import { describe, expect, it } from 'vitest';
import { isStripeConnectReady } from '../utils/isStripeConnectReady';

describe('isStripeConnectReady', () => {
  it('requires complete onboarding and charges enabled', () => {
    expect(
      isStripeConnectReady({
        onboarding_status: 'complete',
        charges_enabled: true,
      })
    ).toBe(true);
  });

  it('is false when setup is unfinished or charges are off', () => {
    expect(
      isStripeConnectReady({
        onboarding_status: 'in_progress',
        charges_enabled: true,
      })
    ).toBe(false);
    expect(
      isStripeConnectReady({
        onboarding_status: 'complete',
        charges_enabled: false,
      })
    ).toBe(false);
    expect(isStripeConnectReady(null)).toBe(false);
  });
});
