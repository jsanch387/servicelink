import type { DiscountType } from '../types';

/** Snapshot persisted on `bookings` at create time (promo or sale). */
export type BookingDiscountSnapshot = {
  discountSource: 'sale' | 'promo';
  discountSaleId: string | null;
  discountPromoCodeId: string | null;
  discountType: DiscountType;
  discountValue: number;
  subtotalCents: number;
  discountCents: number;
  /** Display label, e.g. "Summer Sale — 35% off" or "NEWUSER — 20% off". */
  discountLabel: string;
};

export function bookingDiscountColumnsFromSnapshot(
  snapshot: BookingDiscountSnapshot | null | undefined
): {
  discount_source: 'sale' | 'promo' | null;
  discount_sale_id: string | null;
  discount_promo_code_id: string | null;
  discount_type: DiscountType | null;
  discount_value: number | null;
  subtotal_cents: number | null;
  discount_cents: number | null;
  discount_label: string | null;
} {
  if (!snapshot) {
    return {
      discount_source: null,
      discount_sale_id: null,
      discount_promo_code_id: null,
      discount_type: null,
      discount_value: null,
      subtotal_cents: null,
      discount_cents: null,
      discount_label: null,
    };
  }

  return {
    discount_source: snapshot.discountSource,
    discount_sale_id: snapshot.discountSaleId,
    discount_promo_code_id: snapshot.discountPromoCodeId,
    discount_type: snapshot.discountType,
    discount_value: snapshot.discountValue,
    subtotal_cents: snapshot.subtotalCents,
    discount_cents: snapshot.discountCents,
    discount_label: snapshot.discountLabel,
  };
}
