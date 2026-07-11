import type { DiscountType } from '../types';

/** Active sale surfaced on the public booking link (no internal ids). */
export type PublicActiveSale = {
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  startsAt?: Date;
  endsAt?: Date;
};
