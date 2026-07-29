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

  it('includes add-ons from job_details when top-level addon_details is empty', () => {
    const result = computeBookingAmountDue({
      servicePriceCents: 379_00,
      addonDetails: [],
      jobDetails: [
        {
          serviceName: 'Signature Shinee',
          servicePriceCents: 210_00,
          selectedAddOns: [],
          durationMinutes: 150,
          vehicle: null,
          serviceId: null,
          servicePriceOptionLabel: 'SUV',
        },
        {
          serviceName: 'Signature Shinee',
          servicePriceCents: 169_00,
          selectedAddOns: [{ id: 'a1', name: 'Pet hair', priceCents: 20_00 }],
          durationMinutes: 180,
          vehicle: null,
          serviceId: null,
          servicePriceOptionLabel: null,
        },
      ],
      sessionFees: [],
      paidOnlineAmountCents: 0,
      sessionPayment: { method: 'cash', amountCents: 399_00 },
    });

    expect(result.serviceCents).toBe(379_00);
    expect(result.addonCents).toBe(20_00);
    expect(result.adjustedTotalCents).toBe(399_00);
    expect(result.amountDueCents).toBe(0);
  });

  it('sums job_details service prices when top-level service_price_cents is incomplete', () => {
    // Real bug: multi-job row stored only first job's service price (21000)
    // while job_details has 21000 + 16900 and a $20 add-on; 10% sale.
    const result = computeBookingAmountDue({
      servicePriceCents: 210_00,
      addonDetails: [],
      jobDetails: [
        {
          serviceName: 'Signature Shinee',
          servicePriceCents: 210_00,
          selectedAddOns: [],
          durationMinutes: 150,
          vehicle: null,
          serviceId: null,
          servicePriceOptionLabel: 'SUV',
        },
        {
          serviceName: 'Signature Shinee',
          servicePriceCents: 169_00,
          selectedAddOns: [
            { id: 'a1', name: 'Pet hair removal', priceCents: 20_00 },
          ],
          durationMinutes: 180,
          vehicle: null,
          serviceId: null,
          servicePriceOptionLabel: null,
        },
      ],
      sessionFees: [],
      paidOnlineAmountCents: 0,
      sessionPayment: { method: 'cash', amountCents: 359_10 },
      discount: {
        discountSource: 'sale',
        discountType: 'percentage',
        discountValue: 10,
        discountCents: 39_90,
      },
    });

    expect(result.serviceCents).toBe(379_00);
    expect(result.addonCents).toBe(20_00);
    expect(result.discountCents).toBe(39_90);
    expect(result.adjustedTotalCents).toBe(359_10);
    expect(result.amountDueCents).toBe(0);
  });

  it('matches mobile Complete sheet for drifted sale snapshot vs job_details', () => {
    // Live booking f27e0b39: lines sum $430, frozen sale −$39.90 → $390.10.
    // Top-level service_price_cents only had job 1 ($210).
    const result = computeBookingAmountDue({
      servicePriceCents: 210_00,
      addonDetails: {
        addons: [
          {
            id: 'a1',
            name: 'Pet hair removal',
            priceCents: 20_00,
          },
        ],
      },
      jobDetails: [
        {
          serviceName: 'Signature Shinee',
          servicePriceCents: 210_00,
          selectedAddOns: [
            { id: 'a1', name: 'Pet hair removal', priceCents: 20_00 },
          ],
          durationMinutes: 180,
          vehicle: null,
          serviceId: null,
          servicePriceOptionLabel: 'SUV',
        },
        {
          serviceName: 'Signature Shinee',
          servicePriceCents: 200_00,
          selectedAddOns: [],
          durationMinutes: 150,
          vehicle: null,
          serviceId: null,
          servicePriceOptionLabel: 'SUV',
        },
      ],
      sessionFees: [],
      paidOnlineAmountCents: 0,
      sessionPayment: { method: 'cash', amountCents: 390_10 },
      discount: {
        discountSource: 'sale',
        discountType: 'percentage',
        discountValue: 10,
        discountCents: 39_90,
      },
    });

    expect(result.serviceCents).toBe(410_00);
    expect(result.addonCents).toBe(20_00);
    expect(result.discountCents).toBe(39_90);
    expect(result.adjustedTotalCents).toBe(390_10);
    expect(result.amountDueCents).toBe(0);
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
