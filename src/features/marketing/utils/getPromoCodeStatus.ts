import type { PromoCode, PromoCodeStatus } from '../types';
import { compareMarketingCalendarDayToWindow } from './marketingCalendarDate';

/**
 * Dashboard / validate badge status. Date windows use UTC calendar days
 * (same as how we store date-input bounds).
 */
export function getPromoCodeStatus(
  promoCode: PromoCode,
  now: Date = new Date()
): PromoCodeStatus {
  if (!promoCode.isActive) return 'inactive';

  const position = compareMarketingCalendarDayToWindow(
    now,
    promoCode.startsAt,
    promoCode.endsAt
  );
  if (position === 'before') return 'scheduled';
  if (position === 'after') return 'expired';

  if (promoCode.maxUses && promoCode.currentUseCount >= promoCode.maxUses) {
    return 'expired';
  }

  return 'active';
}
