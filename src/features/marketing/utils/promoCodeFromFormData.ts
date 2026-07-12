import type { PromoCode, PromoCodeFormData } from '../types';

export function promoCodeFromFormData(formData: PromoCodeFormData): PromoCode {
  return {
    id: crypto.randomUUID(),
    code: formData.code.trim(),
    description: formData.description.trim() || undefined,
    discountType: formData.discountType,
    discountValue: parseFloat(formData.discountValue),
    isActive: formData.isActive,
    startsAt:
      formData.hasDateRange && formData.startsAt
        ? new Date(formData.startsAt)
        : null,
    endsAt:
      formData.hasDateRange && formData.endsAt
        ? new Date(formData.endsAt)
        : null,
    maxUses:
      formData.hasMaxUses && formData.maxUses
        ? parseInt(formData.maxUses, 10)
        : null,
    currentUseCount: 0,
    oneUsePerCustomer: formData.oneUsePerCustomer,
    createdAt: new Date(),
  };
}
