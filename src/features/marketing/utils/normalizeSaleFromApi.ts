import type { Sale } from '../types';

/** Normalize API JSON dates into Date instances for UI helpers. */
export function normalizeSaleFromApi(sale: Sale): Sale {
  return {
    ...sale,
    startsAt: sale.startsAt ? new Date(sale.startsAt) : null,
    endsAt: sale.endsAt ? new Date(sale.endsAt) : null,
    createdAt: new Date(sale.createdAt),
  };
}
