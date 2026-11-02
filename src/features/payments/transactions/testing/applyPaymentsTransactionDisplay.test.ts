import { describe, expect, it } from 'vitest';
import { applyPaymentsTransactionDisplay } from '../applyPaymentsTransactionDisplay';
import type { MappedPaymentsTransaction } from '../mapStripeBalanceTransaction';

function baseItem(
  overrides: Partial<MappedPaymentsTransaction>
): MappedPaymentsTransaction {
  return {
    id: 'txn_1',
    kind: 'payment',
    status: 'available',
    amountCents: 4000,
    netCents: 3854,
    feeCents: 146,
    displayAmountCents: 3854,
    currency: 'usd',
    createdAt: '2026-08-24T17:00:00.000Z',
    availableOn: null,
    title: 'Lights',
    subtitle: 'Jordan Lee · Card',
    description: null,
    source: 'booking',
    methodLabel: 'Card',
    customerName: 'Jordan Lee',
    bookingId: 'book_1',
    paymentRequestId: null,
    payoutArrivalAt: null,
    extraCount: 0,
    serviceName: 'Lights',
    jobCount: 1,
    bankLast4: null,
    cardLast4: null,
    tone: 'in',
    amountLabel: '',
    statusLabel: '',
    dateLabel: '',
    feeLabel: null,
    refs: {},
    ...overrides,
  };
}

describe('applyPaymentsTransactionDisplay', () => {
  it('labels Stripe fees on collected charges', () => {
    const item = applyPaymentsTransactionDisplay(baseItem({}));
    expect(item.feeLabel).toBe('Stripe fee $1.46');
    expect(item.amountLabel).toBe('+$38.54');
  });

  it('labels Stripe fees on refunds and payouts when present', () => {
    expect(
      applyPaymentsTransactionDisplay(
        baseItem({
          kind: 'refund',
          displayAmountCents: -2000,
          feeCents: 30,
        })
      ).feeLabel
    ).toBe('Stripe fee $0.30');

    expect(
      applyPaymentsTransactionDisplay(
        baseItem({
          kind: 'payout',
          displayAmountCents: 12000,
          feeCents: 25,
        })
      ).feeLabel
    ).toBe('Stripe fee $0.25');
  });

  it('hides the fee when Stripe did not take one', () => {
    expect(
      applyPaymentsTransactionDisplay(baseItem({ feeCents: 0 })).feeLabel
    ).toBeNull();
  });
});
