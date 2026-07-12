import type { DiscountType } from '../types';

export function formatPromoDiscount(
  type: DiscountType,
  value: number | string
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return type === 'percentage' ? `${num}% off` : `$${num} off`;
}
