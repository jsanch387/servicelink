import { describe, expect, it } from 'vitest';
import {
  computeBookingAmountDue,
  computeBookingRemainingAmountCents,
} from '@/features/availability/booking/server/computeBookingAmountDue';

describe('computeBookingAmountDue', () => {
  it('matches mobile subtotal + amount due math', () => {
    const result = computeBookingAmountDue({
      servicePriceCents: 10000,
      addonDetails: [{ name: 'Odor', priceCents: 2500 }],
      sessionFees: [{ label: 'Pet hair', amountCents: 2500 }],
      paidOnlineAmountCents: 5000,
      sessionPayment: { method: 'cash', amountCents: 10000 },
    });

    expect(result.subtotalCents).toBe(15000);
    expect(result.discountCents).toBe(0);
    expect(result.adjustedTotalCents).toBe(15000);
    expect(result.amountDueCents).toBe(0);
  });

  it('applies promo/sale discount to service + add-ons only', () => {
    const result = computeBookingAmountDue({
      servicePriceCents: 10000,
      addonDetails: [{ name: 'Odor', priceCents: 2500 }],
      sessionFees: [{ label: 'Pet hair', amountCents: 2500 }],
      paidOnlineAmountCents: 0,
      sessionPayment: { method: 'cash', amountCents: 12500 },
      discount: {
        discountSource: 'promo',
        discountType: 'percentage',
        discountValue: 20,
      },
    });

    // 20% of 12500 line = 2500; adjusted = 12500 - 2500 + 2500 fees = 12500
    expect(result.discountCents).toBe(2500);
    expect(result.subtotalCents).toBe(15000);
    expect(result.adjustedTotalCents).toBe(12500);
    expect(result.amountDueCents).toBe(0);
  });

  it('rejects positive amount due when session payment is short', () => {
    const result = computeBookingAmountDue({
      servicePriceCents: 12000,
      addonDetails: [],
      sessionFees: [],
      paidOnlineAmountCents: 0,
      sessionPayment: { method: 'cash', amountCents: 5000 },
    });

    expect(result.amountDueCents).toBe(7000);
  });

  it('allows zero due with no session payment when paid online in full', () => {
    const result = computeBookingAmountDue({
      servicePriceCents: 8000,
      addonDetails: [],
      sessionFees: [],
      paidOnlineAmountCents: 8000,
      sessionPayment: undefined,
    });

    expect(result.amountDueCents).toBe(0);
  });

  it('yields negative amount due when session payment is over-reported', () => {
    const result = computeBookingAmountDue({
      servicePriceCents: 10000,
      addonDetails: [],
      sessionFees: [],
      paidOnlineAmountCents: 0,
      sessionPayment: { method: 'tap_to_pay', amountCents: 12000 },
    });

    expect(result.amountDueCents).toBe(-2000);
  });
});

describe('computeBookingRemainingAmountCents', () => {
  it('zeros remaining when session payment covers balance after online deposit', () => {
    expect(
      computeBookingRemainingAmountCents({
        totalAmountCents: 23000,
        paidOnlineCents: 0,
        sessionPayCents: 23000,
      })
    ).toBe(0);
  });

  it('accounts for online deposit plus session payment', () => {
    expect(
      computeBookingRemainingAmountCents({
        totalAmountCents: 17000,
        paidOnlineCents: 5000,
        sessionPayCents: 12000,
      })
    ).toBe(0);
  });
});
