import { describe, expect, it } from 'vitest';
import type Stripe from 'stripe';
import { mapStripeBalanceTransaction } from '../mapStripeBalanceTransaction';

function makeTxn(
  overrides: Partial<Stripe.BalanceTransaction> & {
    source?: Stripe.BalanceTransaction['source'];
  }
): Stripe.BalanceTransaction {
  return {
    id: 'txn_1',
    object: 'balance_transaction',
    amount: 4000,
    fee: 146,
    net: 3854,
    currency: 'usd',
    type: 'charge',
    status: 'available',
    created: 1_700_000_000,
    available_on: 1_700_086_400,
    description: 'Charge',
    ...overrides,
  } as Stripe.BalanceTransaction;
}

describe('mapStripeBalanceTransaction', () => {
  it('skips Stripe fee rows', () => {
    expect(
      mapStripeBalanceTransaction(makeTxn({ type: 'stripe_fee', amount: -146 }))
    ).toBeNull();
  });

  it('maps a walk-up Tap to Pay charge with note and card', () => {
    const item = mapStripeBalanceTransaction(
      makeTxn({
        source: {
          object: 'charge',
          payment_intent: 'pi_1',
          description: 'Lights',
          metadata: {
            kind: 'walkup_tap_to_pay',
            note: 'Lights',
            paymentRequestId: 'req_1',
          },
          billing_details: { name: null },
          payment_method_details: {
            card: { brand: 'visa', last4: '4242' },
          },
        } as unknown as Stripe.Charge,
      })
    );

    expect(item).toMatchObject({
      kind: 'payment',
      source: 'tap_to_pay',
      title: 'Lights',
      methodLabel: 'Tap to pay',
      displayAmountCents: 3854,
      feeCents: 146,
      paymentRequestId: 'req_1',
      tone: 'in',
      amountLabel: '+$38.54',
      statusLabel: 'Paid',
      feeLabel: 'Stripe fee $1.46',
    });
  });

  it('labels a card charge by brand without last-4', () => {
    const item = mapStripeBalanceTransaction(
      makeTxn({
        source: {
          object: 'charge',
          payment_intent: 'pi_card',
          billing_details: { name: 'Jordan Lee' },
          payment_method_details: {
            card: { brand: 'visa', last4: '4242' },
          },
        } as unknown as Stripe.Charge,
      })
    );

    expect(item).toMatchObject({
      methodLabel: 'Card',
      subtitle: 'Jordan Lee · Card',
    });
    expect(item?.methodLabel).not.toContain('Visa');
    expect(item?.methodLabel).not.toContain('4242');
    expect(item?.subtitle).not.toContain('4242');
  });

  it('maps a membership charge', () => {
    const item = mapStripeBalanceTransaction(
      makeTxn({
        source: {
          object: 'charge',
          payment_intent: 'pi_mem',
          metadata: {
            kind: 'membership_checkout',
            membershipPlanId: 'plan_1',
            customerEmail: 'pat@example.com',
          },
        } as unknown as Stripe.Charge,
      })
    );

    expect(item).toMatchObject({
      kind: 'payment',
      source: 'membership',
      title: 'Membership',
      methodLabel: 'Membership',
      customerName: 'pat@example.com',
    });
  });

  it('maps a payout as a bank deposit with a positive display amount', () => {
    const item = mapStripeBalanceTransaction(
      makeTxn({
        id: 'txn_po',
        type: 'payout',
        amount: -12000,
        net: -12000,
        fee: 0,
        description: 'STRIPE PAYOUT',
        source: {
          object: 'payout',
          status: 'in_transit',
          arrival_date: 1_700_172_800,
          destination: { last4: '6789' },
        } as unknown as Stripe.Payout,
      })
    );

    expect(item).toMatchObject({
      kind: 'payout',
      source: 'payout',
      title: 'Payout',
      methodLabel: 'Bank deposit',
      status: 'in_transit',
      statusLabel: 'On the way',
      subtitle: '',
      extraCount: 0,
      displayAmountCents: 12000,
    });
  });

  it('labels a paid payout as Arrived', () => {
    const item = mapStripeBalanceTransaction(
      makeTxn({
        id: 'txn_po_paid',
        type: 'payout',
        amount: -12000,
        net: -12000,
        fee: 0,
        source: {
          object: 'payout',
          status: 'paid',
          arrival_date: 1_700_172_800,
        } as unknown as Stripe.Payout,
      })
    );

    expect(item).toMatchObject({
      title: 'Payout',
      subtitle: '',
      statusLabel: 'Arrived',
      extraCount: 0,
    });
  });

  it('maps a refund as a negative net amount', () => {
    const item = mapStripeBalanceTransaction(
      makeTxn({
        type: 'refund',
        amount: -2000,
        net: -2000,
        fee: 0,
        description: 'Refund',
        source: {
          object: 'refund',
          payment_intent: 'pi_1',
        } as unknown as Stripe.Refund,
      })
    );

    expect(item).toMatchObject({
      kind: 'refund',
      title: 'Refund',
      methodLabel: 'Refund',
      displayAmountCents: -2000,
    });
  });
});
