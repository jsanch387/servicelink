import type { Sale, SaleStatus } from '../types';

export function getSaleStatus(sale: Sale): SaleStatus {
  if (!sale.isActive) return 'inactive';

  if (!sale.startsAt || !sale.endsAt) {
    return 'active';
  }

  const now = new Date();

  if (new Date(sale.startsAt) > now) {
    return 'scheduled';
  }

  if (new Date(sale.endsAt) < now) {
    return 'expired';
  }

  return 'active';
}
