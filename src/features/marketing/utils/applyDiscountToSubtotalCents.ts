import type { DiscountType } from '../types';

/** Matches discount cap rules in marketing DATABASE.md / FLOWS.md. */
export function applyDiscountToSubtotalCents(
  subtotalCents: number,
  discountType: DiscountType,
  discountValue: number
): { discountCents: number; totalCents: number } {
  if (subtotalCents <= 0 || !Number.isFinite(discountValue) || discountValue <= 0) {
    return { discountCents: 0, totalCents: subtotalCents };
  }

  const discountCents =
    discountType === 'percentage'
      ? Math.min(subtotalCents, Math.round((subtotalCents * discountValue) / 100))
      : Math.min(subtotalCents, Math.round(discountValue * 100));

  return {
    discountCents,
    totalCents: subtotalCents - discountCents,
  };
}
