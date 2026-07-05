import {
  buildPublicBookingNoCheckoutPaymentSummary,
  buildStripeCheckoutPaymentSummary,
} from '@/features/email/availability-booking-notification/buildAvailabilityBookingPaymentSummary';
import { describe, expect, it } from 'vitest';

describe('buildPublicBookingNoCheckoutPaymentSummary', () => {
  it('pay in person (shop mode) shows clear payment method', () => {
    const summary = buildPublicBookingNoCheckoutPaymentSummary({
      paymentsEnabled: true,
      checkoutMode: 'in_person',
      currency: 'usd',
      totalPriceCents: 15000,
      hasPriceLineItems: true,
    });
    expect(summary?.rows).toEqual([
      { label: 'Payment method', value: 'Pay in person' },
    ]);
    expect(summary?.rows.some(r => r.label.includes('ServiceLink'))).toBe(
      false
    );
  });

  it('customer choice pay in person uses same messaging', () => {
    const summary = buildPublicBookingNoCheckoutPaymentSummary({
      paymentsEnabled: true,
      checkoutMode: 'customer_choice',
      clientPaymentMethod: 'pay_in_person',
      currency: 'usd',
      totalPriceCents: 15000,
      hasPriceLineItems: false,
    });
    expect(summary?.rows).toEqual([
      { label: 'Payment method', value: 'Pay in person' },
      { label: 'Amount due at appointment', value: '$150.00' },
    ]);
  });

  it('payments disabled omits payment section', () => {
    expect(
      buildPublicBookingNoCheckoutPaymentSummary({
        paymentsEnabled: false,
        checkoutMode: 'in_app',
        currency: 'usd',
        totalPriceCents: 15000,
        hasPriceLineItems: true,
      })
    ).toBeUndefined();
  });
});

describe('buildStripeCheckoutPaymentSummary', () => {
  it('paid in full', () => {
    const summary = buildStripeCheckoutPaymentSummary({
      paymentStatus: 'paid_full',
      amountPaidCents: 37500,
      remainingCents: 0,
      totalPriceCents: 37500,
      currency: 'usd',
      hasPriceLineItems: true,
    });
    expect(summary.rows).toEqual([{ label: 'Paid in full', value: '$375.00' }]);
    expect(summary.stripeCardPayment).toBe(true);
  });

  it('deposit paid with remaining balance', () => {
    const summary = buildStripeCheckoutPaymentSummary({
      paymentStatus: 'deposit_paid',
      amountPaidCents: 5000,
      remainingCents: 25000,
      totalPriceCents: 30000,
      currency: 'usd',
      hasPriceLineItems: true,
    });
    expect(summary.rows).toEqual([
      { label: 'Deposit paid', value: '$50.00' },
      { label: 'Remaining balance', value: '$250.00' },
    ]);
  });
});
