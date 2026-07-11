import type { PublicActiveSale } from '../types/publicActiveSale';
import { applyDiscountToSubtotalCents } from './applyDiscountToSubtotalCents';

export type ServiceSalePrice = {
  originalCents: number;
  saleCents: number;
};

export function getServiceSalePriceCents(
  priceCents: number,
  sale: Pick<PublicActiveSale, 'discountType' | 'discountValue'> | null | undefined
): ServiceSalePrice | null {
  if (!sale || priceCents <= 0) return null;

  const { discountCents, totalCents } = applyDiscountToSubtotalCents(
    priceCents,
    sale.discountType,
    sale.discountValue
  );

  if (discountCents <= 0 || totalCents >= priceCents) return null;

  return { originalCents: priceCents, saleCents: totalCents };
}
