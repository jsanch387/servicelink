import { describe, expect, it } from 'vitest';
import { mergePaymentsTransactionPage } from '../mergePaymentsTransactionItems';
import type { MappedPaymentsTransaction } from '../mapStripeBalanceTransaction';

function item(
  overrides: Pick<MappedPaymentsTransaction, 'id' | 'createdAt'>
): MappedPaymentsTransaction {
  return {
    kind: 'payment',
    status: 'available',
    amountCents: 100,
    netCents: 100,
    feeCents: 0,
    displayAmountCents: 100,
    currency: 'usd',
    title: 'Payment',
    subtitle: null,
    description: null,
    source: 'other',
    methodLabel: 'Card',
    customerName: null,
    bookingId: null,
    paymentRequestId: null,
    payoutArrivalAt: null,
    extraCount: 0,
    serviceName: null,
    jobCount: 0,
    bankLast4: null,
    cardLast4: null,
    tone: 'in',
    amountLabel: '+$1.00',
    statusLabel: 'Paid',
    dateLabel: 'Aug 24',
    feeLabel: null,
    availableOn: null,
    refs: {},
    ...overrides,
  };
}

describe('mergePaymentsTransactionPage', () => {
  it('sorts Stripe and offline rows newest first', () => {
    const page = mergePaymentsTransactionPage({
      stripeItems: [
        item({ id: 'txn_old', createdAt: '2026-08-24T10:00:00.000Z' }),
      ],
      localItems: [
        item({ id: 'local_bp_new', createdAt: '2026-08-24T12:00:00.000Z' }),
      ],
      limit: 20,
      stripeHasMore: false,
      localHasMore: false,
    });

    expect(page.items.map(row => row.id)).toEqual(['local_bp_new', 'txn_old']);
    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeNull();
  });

  it('keeps the last Stripe id in nextCursor when the page is all cash', () => {
    const page = mergePaymentsTransactionPage({
      stripeItems: [],
      localItems: [
        item({ id: 'local_bp_1', createdAt: '2026-08-24T12:00:00.000Z' }),
      ],
      limit: 1,
      stripeHasMore: true,
      localHasMore: false,
      previousStripeAfter: 'txn_prev',
    });

    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBe('2026-08-24T12:00:00.000Z|txn_prev');
  });
});
