import { describe, expect, it } from 'vitest';
import type Stripe from 'stripe';
import { toRevenueEvent } from '../loadStripeRevenuePayments';

function txn(
  overrides: Partial<Stripe.BalanceTransaction> & {
    type: Stripe.BalanceTransaction.Type;
  }
): Stripe.BalanceTransaction {
  return {
    id: 'txn_1',
    object: 'balance_transaction',
    amount: 4000,
    available_on: 1_777_000_000,
    created: 1_777_000_000,
    currency: 'usd',
    description: 'Payment',
    exchange_rate: null,
    fee: 146,
    fee_details: [],
    net: 3854,
    reporting_category: 'charge',
    source: null,
    status: 'available',
    ...overrides,
  } as Stripe.BalanceTransaction;
}

describe('toRevenueEvent', () => {
  it('keeps card charge net as earnings', () => {
    const event = toRevenueEvent(
      txn({
        type: 'charge',
        source: {
          object: 'charge',
          metadata: { kind: 'booking_checkout' },
        } as Stripe.Charge,
      })
    );
    expect(event).toMatchObject({
      amountCents: 3854,
      source: 'booking',
    });
  });

  it('skips payouts so bank transfers are not earnings', () => {
    expect(toRevenueEvent(txn({ type: 'payout', net: -4000 }))).toBeNull();
  });

  it('keeps refunds as a negative amount', () => {
    const event = toRevenueEvent(
      txn({ type: 'refund', amount: -2000, net: -2000, fee: 0 })
    );
    expect(event?.amountCents).toBe(-2000);
  });
});
