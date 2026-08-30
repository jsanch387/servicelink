import { describe, expect, it } from 'vitest';
import { STRIPE_FEE_RATES } from '../constants/stripeProcessingFees';

describe('STRIPE_FEE_RATES', () => {
  it('uses Stripe Standard US headline rates', () => {
    expect(STRIPE_FEE_RATES).toEqual([
      { id: 'online', label: 'Cards', value: '2.9% + 30¢' },
      { id: 'tap_to_pay', label: 'Tap to pay', value: '2.7% + 5¢' },
    ]);
  });
});
