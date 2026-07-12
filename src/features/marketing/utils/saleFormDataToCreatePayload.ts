import type { SaleFormData } from '../types';

export function saleFormDataToCreatePayload(formData: SaleFormData) {
  return {
    name: formData.name.trim(),
    description: formData.description.trim() || null,
    discountType: formData.discountType,
    discountValue: parseFloat(formData.discountValue),
    isActive: formData.isActive,
    startsAt:
      formData.hasDateRange && formData.startsAt ? formData.startsAt : null,
    endsAt: formData.hasDateRange && formData.endsAt ? formData.endsAt : null,
  };
}
