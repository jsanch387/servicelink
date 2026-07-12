import type { PromoCodeFormData } from '../types';

export function promoCodeFormDataToCreatePayload(formData: PromoCodeFormData) {
  return {
    code: formData.code.trim().toUpperCase(),
    description: formData.description.trim() || null,
    discountType: formData.discountType,
    discountValue: parseFloat(formData.discountValue),
    isActive: formData.isActive,
    startsAt:
      formData.hasDateRange && formData.startsAt ? formData.startsAt : null,
    endsAt: formData.hasDateRange && formData.endsAt ? formData.endsAt : null,
    oneUsePerCustomer: formData.oneUsePerCustomer,
  };
}
