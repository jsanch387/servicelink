import { quotePublicBookingSalesTax } from '@/features/availability/booking/utils/publicBookingSalesTax';
import { formatSalesTaxRateLabel } from '@/features/payments/utils/salesTaxRate';

export type InvoiceBookingTax = {
  taxCents: number;
  taxRateBps: number;
};

/**
 * Which rate the invoice preview and the save use.
 * An appointment that already has a payment row keeps that decision, including no tax.
 * A standalone bill uses the shop's current settings.
 */
export function invoiceTaxPreview(input: {
  shopTaxEnabled: boolean;
  shopTaxRateBps: number;
  bookingPayment: InvoiceBookingTax | null;
}): { salesTaxEnabled: boolean; salesTaxRateBps: number } {
  if (input.bookingPayment) {
    const enabled =
      input.bookingPayment.taxCents > 0 && input.bookingPayment.taxRateBps >= 1;
    return {
      salesTaxEnabled: enabled,
      salesTaxRateBps: enabled ? input.bookingPayment.taxRateBps : 0,
    };
  }

  return {
    salesTaxEnabled: input.shopTaxEnabled === true,
    salesTaxRateBps: input.shopTaxRateBps,
  };
}

/** Tax once on the line total. Line prices stay pre-tax. */
export function invoiceSalesTaxQuote(input: {
  subtotalCents: number;
  shopTaxEnabled: boolean;
  shopTaxRateBps: number;
  bookingPayment: InvoiceBookingTax | null;
}) {
  const preview = invoiceTaxPreview(input);
  return quotePublicBookingSalesTax({
    priceAfterDiscountCents: input.subtotalCents,
    taxEnabled: preview.salesTaxEnabled,
    taxRateBps: preview.salesTaxRateBps,
  });
}

export function invoiceSalesTaxLabel(rateBps: number): string {
  const rate = formatSalesTaxRateLabel(rateBps);
  return rate ? `Tax (${rate})` : 'Tax';
}
