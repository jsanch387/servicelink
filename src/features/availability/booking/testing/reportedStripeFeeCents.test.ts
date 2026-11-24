import { describe, expect, it } from 'vitest';
import { reportedStripeFeeCents } from '@/features/availability/booking/server/reportedStripeFeeCents';
import type Stripe from 'stripe';

describe('reportedStripeFeeCents', () => {
  it('returns null until Stripe sends the balance transaction', () => {
    expect(reportedStripeFeeCents(null)).toBeNull();
    expect(reportedStripeFeeCents(undefined)).toBeNull();
    expect(reportedStripeFeeCents('txn_123')).toBeNull();
  });

  it('returns the reported fee, including zero', () => {
    expect(
      reportedStripeFeeCents({ fee: 87 } as Stripe.BalanceTransaction)
    ).toBe(87);
    expect(
      reportedStripeFeeCents({ fee: 0 } as Stripe.BalanceTransaction)
    ).toBe(0);
  });
});
