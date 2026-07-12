import type { PromoCode } from '../types';

/** Normalize API JSON dates into Date instances for UI helpers. */
export function normalizePromoCodeFromApi(promoCode: PromoCode): PromoCode {
  return {
    ...promoCode,
    startsAt: promoCode.startsAt ? new Date(promoCode.startsAt) : null,
    endsAt: promoCode.endsAt ? new Date(promoCode.endsAt) : null,
    createdAt: new Date(promoCode.createdAt),
  };
}
