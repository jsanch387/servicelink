import type { DiscountType } from '../types';

/** Large display value for the public sale ticket (e.g. "30%" + "off"). */
export function formatPublicSaleDiscountHighlight(
  type: DiscountType,
  value: number | string
): { main: string; suffixKey: 'off' } | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(num) || num <= 0) return null;

  if (type === 'percentage') {
    return { main: `${num}%`, suffixKey: 'off' };
  }

  const formatted =
    num % 1 === 0 ? `$${num}` : `$${num.toFixed(2).replace(/\.?0+$/, '')}`;
  return { main: formatted, suffixKey: 'off' };
}
