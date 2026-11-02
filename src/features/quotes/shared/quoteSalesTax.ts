import { quotePublicBookingSalesTax } from '@/features/availability/booking/utils/publicBookingSalesTax';
import { formatSalesTaxRateLabel } from '@/features/payments/utils/salesTaxRate';

/** Tax once on the quoted price. The price itself stays pre-tax. */
export function quoteSalesTax(input: {
  priceCents: number;
  taxEnabled: boolean;
  taxRateBps: number;
}) {
  return quotePublicBookingSalesTax({
    priceAfterDiscountCents: input.priceCents,
    taxEnabled: input.taxEnabled,
    taxRateBps: input.taxRateBps,
  });
}

export function quoteSalesTaxLabel(rateBps: number): string {
  const rate = formatSalesTaxRateLabel(rateBps);
  return rate ? `Tax (${rate})` : 'Tax';
}

export function quoteAmountDueCents(
  priceCents: number,
  taxCents: number
): number {
  return (
    Math.max(0, Math.round(priceCents)) + Math.max(0, Math.round(taxCents))
  );
}
