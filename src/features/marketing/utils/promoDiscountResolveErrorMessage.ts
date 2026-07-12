import type { PromoDiscountResolveError } from '../server/resolveBookingPromoDiscountSnapshot';

/** English messages for API responses (client may map via i18n using `errorCode`). */
export function promoDiscountResolveErrorMessage(
  error: PromoDiscountResolveError
): string {
  switch (error) {
    case 'invalid':
      return 'That promo code is not valid.';
    case 'inactive':
      return 'That promo code is no longer active.';
    case 'scheduled':
      return 'That promo code is not available yet.';
    case 'expired':
      return 'That promo code has expired.';
    case 'already_used':
      return 'You have already used this promo code.';
    case 'identity_required':
      return 'Add a phone or email to use this promo code.';
    case 'unavailable':
      return 'Promo codes are not available for this business.';
    default:
      return 'That promo code is not valid.';
  }
}
