import { describe, expect, it } from 'vitest';
import { sumStripeBalanceCents } from '../sumStripeBalanceCents';

describe('sumStripeBalanceCents', () => {
  it('sums only the requested currency', () => {
    expect(
      sumStripeBalanceCents(
        [
          { amount: 10_000, currency: 'usd' },
          { amount: 500, currency: 'eur' },
          { amount: 250, currency: 'usd' },
        ],
        'usd'
      )
    ).toBe(10_250);
  });
});
