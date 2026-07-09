import type { Sale, SaleFormData } from '../types';

export function saleFromFormData(formData: SaleFormData): Sale {
  return {
    id: crypto.randomUUID(),
    name: formData.name.trim(),
    description: formData.description.trim() || undefined,
    discountType: formData.discountType,
    discountValue: parseFloat(formData.discountValue),
    isActive: formData.isActive,
    startsAt: new Date(formData.startsAt),
    endsAt: new Date(formData.endsAt),
    appliesToAllServices: true,
    serviceIds: undefined,
    createdAt: new Date(),
  };
}
