import { describe, expect, it } from 'vitest';

import { subscriptionIsScheduledCancelWithoutRenewal } from '../utils/subscriptionScheduledCancel';

describe('subscriptionIsScheduledCancelWithoutRenewal', () => {
  const nowSec = Math.floor(Date.now() / 1000);
  const future = nowSec + 86400 * 30;

  it('true when cancel_at_period_end is true', () => {
    expect(
      subscriptionIsScheduledCancelWithoutRenewal({
        cancel_at_period_end: true,
        cancel_at: null,
      } as never)
    ).toBe(true);
  });

  it('true when cancel_at is in the future (Basil / flexible billing)', () => {
    expect(
      subscriptionIsScheduledCancelWithoutRenewal({
        cancel_at_period_end: false,
        cancel_at: future,
      } as never)
    ).toBe(true);
  });

  it('false when neither flag nor future cancel_at', () => {
    expect(
      subscriptionIsScheduledCancelWithoutRenewal({
        cancel_at_period_end: false,
        cancel_at: null,
      } as never)
    ).toBe(false);
  });

  it('false when cancel_at is in the past', () => {
    expect(
      subscriptionIsScheduledCancelWithoutRenewal({
        cancel_at_period_end: false,
        cancel_at: nowSec - 100,
      } as never)
    ).toBe(false);
  });
});
