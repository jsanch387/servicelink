import { describe, expect, it } from 'vitest';

import { isExemptFromFreeTierLifetimeBookingCap } from '../utils/isProAccess';

const BILLED = 'sub_test123';
const CUS = 'cus_test123';
const futureEnd = new Date(Date.now() + 86400000).toISOString();

describe('isExemptFromFreeTierLifetimeBookingCap', () => {
  it('exempt when isProAccess (comped pro, no Stripe sub)', () => {
    expect(
      isExemptFromFreeTierLifetimeBookingCap('pro', null, null, null, null)
    ).toBe(true);
  });

  it('exempt when active/trialing billed Pro', () => {
    expect(
      isExemptFromFreeTierLifetimeBookingCap(
        'pro',
        futureEnd,
        'active',
        BILLED,
        CUS
      )
    ).toBe(true);
  });

  it('exempt when DB tier flipped to free but subscription still open (past_due)', () => {
    expect(
      isExemptFromFreeTierLifetimeBookingCap(
        'free',
        futureEnd,
        'past_due',
        BILLED,
        CUS
      )
    ).toBe(true);
  });

  it('exempt for unpaid / incomplete / paused while sub id exists', () => {
    expect(
      isExemptFromFreeTierLifetimeBookingCap(
        'free',
        futureEnd,
        'unpaid',
        BILLED,
        CUS
      )
    ).toBe(true);
    expect(
      isExemptFromFreeTierLifetimeBookingCap(
        'free',
        futureEnd,
        'incomplete',
        BILLED,
        CUS
      )
    ).toBe(true);
    expect(
      isExemptFromFreeTierLifetimeBookingCap(
        'free',
        futureEnd,
        'paused',
        BILLED,
        CUS
      )
    ).toBe(true);
  });

  it('not exempt for true free (no subscription id)', () => {
    expect(
      isExemptFromFreeTierLifetimeBookingCap('free', futureEnd, null, '', CUS)
    ).toBe(false);
  });

  it('not exempt when subscription ended (canceled / incomplete_expired)', () => {
    expect(
      isExemptFromFreeTierLifetimeBookingCap(
        'free',
        futureEnd,
        'canceled',
        BILLED,
        CUS
      )
    ).toBe(false);
    expect(
      isExemptFromFreeTierLifetimeBookingCap(
        'free',
        futureEnd,
        'incomplete_expired',
        BILLED,
        CUS
      )
    ).toBe(false);
  });
});
