import type { PromoCode, PromoCodeStatus } from '../types';

export function getPromoCodeStatus(promoCode: PromoCode): PromoCodeStatus {
  if (!promoCode.isActive) return 'inactive';

  const now = new Date();

  if (promoCode.startsAt && new Date(promoCode.startsAt) > now) {
    return 'scheduled';
  }

  if (promoCode.endsAt && new Date(promoCode.endsAt) < now) {
    return 'expired';
  }

  if (promoCode.maxUses && promoCode.currentUseCount >= promoCode.maxUses) {
    return 'expired';
  }

  return 'active';
}
