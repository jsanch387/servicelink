import { describe, expect, it } from 'vitest';
import {
  onlineAmountDueNowCents,
  quotePublicBookingSalesTax,
} from '@/features/availability/booking/utils/publicBookingSalesTax';

describe('quotePublicBookingSalesTax', () => {
  it('adds tax once on the price after discounts', () => {
    const quote = quotePublicBookingSalesTax({
      priceAfterDiscountCents: 10_000,
      taxEnabled: true,
      taxRateBps: 1000,
    });
    expect(quote.taxCents).toBe(1000);
    expect(quote.totalCents).toBe(11_000);
  });

  it('leaves the price alone when tax is off', () => {
    const quote = quotePublicBookingSalesTax({
      priceAfterDiscountCents: 10_000,
      taxEnabled: false,
      taxRateBps: 1000,
    });
    expect(quote.taxCents).toBe(0);
    expect(quote.totalCents).toBe(10_000);
  });
});

describe('onlineAmountDueNowCents', () => {
  const settings = {
    paymentsEnabled: true,
    depositsEnabled: true,
    depositType: 'percent' as const,
    depositValue: 50,
  };

  it('takes the deposit from the taxed total', () => {
    expect(
      onlineAmountDueNowCents({
        ...settings,
        checkoutMode: 'in_person',
        customerPaymentChoice: null,
        totalCents: 11_000,
      })
    ).toBe(5500);
  });

  it('charges the full taxed total when the customer pays now', () => {
    expect(
      onlineAmountDueNowCents({
        ...settings,
        checkoutMode: 'in_app',
        customerPaymentChoice: null,
        totalCents: 11_000,
      })
    ).toBe(11_000);
  });

  it('charges nothing online for pay in person when deposits are off', () => {
    expect(
      onlineAmountDueNowCents({
        paymentsEnabled: true,
        checkoutMode: 'in_person',
        depositsEnabled: false,
        depositType: 'percent',
        depositValue: 50,
        customerPaymentChoice: null,
        totalCents: 11_000,
      })
    ).toBe(0);
  });
});
