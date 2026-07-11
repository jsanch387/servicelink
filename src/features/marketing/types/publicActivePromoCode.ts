import type { DiscountType } from '../types';

/** Active promo code surfaced on the public booking link (no internal ids). */
export type PublicActivePromoCode = {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  startsAt?: Date;
  endsAt?: Date;
};
