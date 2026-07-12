import type { DiscountType } from '../types';
import { formatPublicSaleDiscountHighlight } from './formatPublicSaleDiscountHighlight';

/** Compact label for booking UI (e.g. "35% off", "$15 off"). */
export function formatPublicSaleDiscountLabel(
  discountType: DiscountType,
  discountValue: number,
  offLabel: string
): string | null {
  const highlight = formatPublicSaleDiscountHighlight(discountType, discountValue);
  if (!highlight) return null;
  return `${highlight.main} ${offLabel}`.trim();
}
