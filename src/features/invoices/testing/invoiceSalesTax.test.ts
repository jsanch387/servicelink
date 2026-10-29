import { describe, expect, it } from 'vitest';

import {
  invoiceSalesTaxLabel,
  invoiceSalesTaxQuote,
  invoiceTaxPreview,
} from '../utils/invoiceSalesTax';

describe('invoice sales tax', () => {
  it('adds the shop rate once on a standalone bill', () => {
    const quote = invoiceSalesTaxQuote({
      subtotalCents: 85_00,
      shopTaxEnabled: true,
      shopTaxRateBps: 225,
      bookingPayment: null,
    });

    expect(quote.taxCents).toBe(191);
    expect(quote.totalCents).toBe(86_91);
    expect(invoiceSalesTaxLabel(quote.rateBps)).toBe('Tax (2.25%)');
  });

  it('leaves the line total alone when tax is off', () => {
    const quote = invoiceSalesTaxQuote({
      subtotalCents: 85_00,
      shopTaxEnabled: false,
      shopTaxRateBps: 225,
      bookingPayment: null,
    });

    expect(quote.taxCents).toBe(0);
    expect(quote.totalCents).toBe(85_00);
  });

  it('keeps an appointment that was already taxed on that same rate', () => {
    const preview = invoiceTaxPreview({
      shopTaxEnabled: true,
      shopTaxRateBps: 825,
      bookingPayment: { taxCents: 191, taxRateBps: 225 },
    });
    const quote = invoiceSalesTaxQuote({
      subtotalCents: 85_00,
      shopTaxEnabled: true,
      shopTaxRateBps: 825,
      bookingPayment: { taxCents: 191, taxRateBps: 225 },
    });

    expect(preview).toEqual({ salesTaxEnabled: true, salesTaxRateBps: 225 });
    expect(quote.taxCents).toBe(191);
    expect(quote.totalCents).toBe(86_91);
  });

  it('does not add tax to an appointment that was not taxed', () => {
    const quote = invoiceSalesTaxQuote({
      subtotalCents: 85_00,
      shopTaxEnabled: true,
      shopTaxRateBps: 225,
      bookingPayment: { taxCents: 0, taxRateBps: 0 },
    });

    expect(quote.taxCents).toBe(0);
    expect(quote.totalCents).toBe(85_00);
  });
});
