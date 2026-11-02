import { describe, expect, it } from 'vitest';

import {
  bookingBalanceIsSettled,
  invoiceMethodForSettledBooking,
} from '../server/syncInvoiceWithBookingPayment';

const openBalance = {
  paymentMethodSelected: 'pay_in_person',
  paymentStatus: 'pending',
  paidOnlineAmountCents: 0,
  remainingAmountCents: 15000,
  sessionPaymentMethod: null,
  sessionPaymentAmountCents: null,
};

describe('bookingBalanceIsSettled', () => {
  it('leaves a pay-in-person balance due', () => {
    expect(bookingBalanceIsSettled(openBalance)).toBe(false);
  });

  it('treats a paid card booking as settled', () => {
    expect(
      bookingBalanceIsSettled({
        ...openBalance,
        paymentStatus: 'paid_full',
        paidOnlineAmountCents: 15000,
        remainingAmountCents: 0,
      })
    ).toBe(true);
    expect(
      invoiceMethodForSettledBooking({
        ...openBalance,
        paidOnlineAmountCents: 15000,
        remainingAmountCents: 0,
      })
    ).toBe('card');
  });

  it('keeps the cash method recorded at complete', () => {
    const paid = {
      ...openBalance,
      paymentStatus: 'paid_full',
      remainingAmountCents: 0,
      sessionPaymentMethod: 'cash',
      sessionPaymentAmountCents: 15000,
    };
    expect(bookingBalanceIsSettled(paid)).toBe(true);
    expect(invoiceMethodForSettledBooking(paid)).toBe('cash');
  });

  it('treats a membership visit as settled', () => {
    expect(
      bookingBalanceIsSettled({
        ...openBalance,
        paymentMethodSelected: 'membership',
        remainingAmountCents: 0,
      })
    ).toBe(true);
  });
});
