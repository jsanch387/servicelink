import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingDiscountSnapshot } from './bookingDiscountSnapshot';
import {
  normalizeEnteredPromoCode,
  resolveBookingPromoDiscountSnapshot,
  type PromoDiscountResolveError,
} from './resolveBookingPromoDiscountSnapshot';
import { resolveBookingSaleDiscountSnapshot } from './resolveBookingSaleDiscountSnapshot';

export type ResolveBookingDiscountResult =
  | { ok: true; snapshot: BookingDiscountSnapshot | null }
  | { ok: false; error: PromoDiscountResolveError };

/**
 * One discount per booking: valid entered promo wins; else qualifying sale.
 */
export async function resolveBookingDiscountSnapshot(
  db: SupabaseClient,
  params: {
    businessId: string;
    ownerHasPro: boolean;
    serviceDateYmd: string;
    subtotalCents: number;
    promoCode?: string | null;
    customerPhone?: string | null;
    customerEmail?: string | null;
  }
): Promise<ResolveBookingDiscountResult> {
  const entered = normalizeEnteredPromoCode(params.promoCode);
  if (entered) {
    const promo = await resolveBookingPromoDiscountSnapshot(db, {
      businessId: params.businessId,
      ownerHasPro: params.ownerHasPro,
      promoCode: entered,
      serviceDateYmd: params.serviceDateYmd,
      subtotalCents: params.subtotalCents,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
    });
    if (!promo.ok) return promo;
    return { ok: true, snapshot: promo.snapshot };
  }

  const sale = await resolveBookingSaleDiscountSnapshot(db, {
    businessId: params.businessId,
    ownerHasPro: params.ownerHasPro,
    serviceDateYmd: params.serviceDateYmd,
    subtotalCents: params.subtotalCents,
  });
  return { ok: true, snapshot: sale };
}
