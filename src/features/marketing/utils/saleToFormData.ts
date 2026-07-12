import type { Sale, SaleFormData } from '../types';
import { toDateInputValue } from '../server/dateUtils';

export function saleToFormData(sale: Sale): SaleFormData {
  const hasDateRange = Boolean(sale.startsAt && sale.endsAt);

  return {
    name: sale.name,
    description: sale.description ?? '',
    discountType: sale.discountType,
    discountValue: String(sale.discountValue),
    isActive: sale.isActive,
    hasDateRange,
    startsAt: hasDateRange ? toDateInputValue(sale.startsAt) : '',
    endsAt: hasDateRange ? toDateInputValue(sale.endsAt) : '',
    appliesToAllServices: sale.appliesToAllServices,
    serviceIds: sale.serviceIds ?? [],
  };
}
