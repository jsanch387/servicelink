import {
  depositDueCents,
  quoteCustomerPayment,
} from '@/features/quotes/shared/quotePaymentCollection';
import { describe, expect, it } from 'vitest';

describe('quoteCustomerPayment', () => {
  it('keeps accept when payments are closed', () => {
    const payment = quoteCustomerPayment({
      collection: 'deposit',
      priceCents: 20000,
      depositType: 'fixed',
      depositValue: 5000,
      gatesOpen: false,
    });
    expect(payment.choices).toEqual(['accept']);
  });

  it('offers a deposit button when the shop requires one', () => {
    const payment = quoteCustomerPayment({
      collection: 'deposit',
      priceCents: 20000,
      depositType: 'percent',
      depositValue: 25,
      gatesOpen: true,
    });
    expect(depositDueCents(20000, 'percent', 25)).toBe(5000);
    expect(payment).toMatchObject({
      choices: ['deposit'],
      depositCents: 5000,
      totalCents: 20000,
    });
  });

  it('lets the customer pay a deposit, the total, or in person', () => {
    const payment = quoteCustomerPayment({
      collection: 'customer_choice',
      priceCents: 20000,
      depositType: 'fixed',
      depositValue: 5000,
      gatesOpen: true,
    });
    expect(payment.choices).toEqual(['deposit', 'full', 'pay_in_person']);
  });

  it('clamps a fixed deposit to the quote total', () => {
    expect(depositDueCents(4000, 'fixed', 9000)).toBe(4000);
  });

  it('falls back to accept when the card amount is below the Stripe minimum', () => {
    const payment = quoteCustomerPayment({
      collection: 'full',
      priceCents: 25,
      depositType: null,
      depositValue: null,
      gatesOpen: true,
    });
    expect(payment.choices).toEqual(['accept']);
  });
});
