import { describe, expect, it } from 'vitest';
import {
  membershipSalesTaxForPrice,
  membershipStripeUnitAmount,
  membershipTaxColumns,
  membershipTaxLabel,
} from '../server/membershipSalesTax';

describe('membership sales tax', () => {
  it('adds tax on top of the plan price and charges that total', () => {
    const quote = membershipSalesTaxForPrice(8500, {
      taxEnabled: true,
      taxRateBps: 225,
    });
    expect(quote.taxCents).toBe(191);
    expect(quote.rateBps).toBe(225);
    expect(
      membershipStripeUnitAmount({
        priceCents: 8500,
        taxCents: quote.taxCents,
      })
    ).toBe(8691);
    expect(
      membershipTaxColumns(8500, { taxEnabled: true, taxRateBps: 225 })
    ).toEqual({
      tax_rate_bps: 225,
      tax_cents: 191,
    });
    expect(membershipTaxLabel(225)).toBe('Tax (2.25%)');
  });

  it('charges the pre-tax price when tax is off', () => {
    const quote = membershipSalesTaxForPrice(8500, {
      taxEnabled: false,
      taxRateBps: 225,
    });
    expect(quote.taxCents).toBe(0);
    expect(
      membershipStripeUnitAmount({ priceCents: 8500, taxCents: quote.taxCents })
    ).toBe(8500);
  });
});
