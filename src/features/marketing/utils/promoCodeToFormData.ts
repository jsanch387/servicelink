import type { PromoCode, PromoCodeFormData } from '../types';
import { toDateInputValue } from '../server/dateUtils';

export function promoCodeToFormData(promoCode: PromoCode): PromoCodeFormData {
  const hasDateRange = Boolean(promoCode.startsAt && promoCode.endsAt);

  return {
    code: promoCode.code,
    description: promoCode.description ?? '',
    discountType: promoCode.discountType,
    discountValue: String(promoCode.discountValue),
    isActive: promoCode.isActive,
    hasDateRange,
    startsAt: hasDateRange ? toDateInputValue(promoCode.startsAt) : '',
    endsAt: hasDateRange ? toDateInputValue(promoCode.endsAt) : '',
    hasMaxUses: false,
    maxUses: '',
    oneUsePerCustomer: promoCode.oneUsePerCustomer,
  };
}
