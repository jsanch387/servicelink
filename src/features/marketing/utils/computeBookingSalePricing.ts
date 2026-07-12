import type { PublicActiveSale } from '../types/publicActiveSale';
import { applyDiscountToSubtotalCents } from './applyDiscountToSubtotalCents';
import { isServiceDateInSaleWindow } from './isServiceDateInSaleWindow';

export type BookingSalePricing = {
  subtotalCents: number;
  discountCents: number;
  estimatedTotalCents: number;
  saleApplies: boolean;
};

export function computeBookingSalePricing(
  subtotalCents: number,
  sale: PublicActiveSale | null | undefined,
  serviceDateYmd: string | null | undefined
): BookingSalePricing {
  const safeSubtotal = Number.isFinite(subtotalCents)
    ? Math.max(0, subtotalCents)
    : 0;

  if (
    !sale ||
    !serviceDateYmd?.trim() ||
    !isServiceDateInSaleWindow(sale, serviceDateYmd) ||
    safeSubtotal <= 0
  ) {
    return {
      subtotalCents: safeSubtotal,
      discountCents: 0,
      estimatedTotalCents: safeSubtotal,
      saleApplies: false,
    };
  }

  const { discountCents, totalCents } = applyDiscountToSubtotalCents(
    safeSubtotal,
    sale.discountType,
    sale.discountValue
  );

  return {
    subtotalCents: safeSubtotal,
    discountCents,
    estimatedTotalCents: totalCents,
    saleApplies: discountCents > 0,
  };
}
