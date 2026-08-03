import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveBookingLineSubtotalCents } from '@/features/availability/booking/utils/resolveBookingLineSubtotalCents';
import { applyDiscountToSubtotalCents } from '../utils/applyDiscountToSubtotalCents';
import { formatPublicSaleDiscountLabel } from '../utils/formatPublicSaleDiscountLabel';
import { getPromoCodeStatus } from '../utils/getPromoCodeStatus';
import { isServiceDateInSaleWindow } from '../utils/isServiceDateInSaleWindow';
import {
  bookingDiscountColumnsFromSnapshot,
  type BookingDiscountSnapshot,
} from './bookingDiscountSnapshot';
import { hasCustomerRedeemedPromoCode } from './hasCustomerRedeemedPromoCode';
import { tryMapPromoCodeRowToPromoCode } from './mapPromoCodeRow';
import { resolveBookingSaleDiscountSnapshot } from './resolveBookingSaleDiscountSnapshot';
import type { PromoCodeRow } from './rows';

const PROMO_SELECT =
  'id, business_id, code, description, discount_type, discount_value, starts_at, ends_at, one_use_per_customer, is_active, created_at, updated_at';

function lineSubtotalCents(booking: {
  service_price_cents?: number | null;
  addon_details?: unknown;
  job_details?: unknown;
}): number {
  return resolveBookingLineSubtotalCents({
    servicePriceCents: booking.service_price_cents,
    addonDetails: booking.addon_details,
    jobDetails: booking.job_details,
  }).lineSubtotalCents;
}

async function resolveExistingPromoOnReschedule(
  db: SupabaseClient,
  params: {
    businessId: string;
    ownerHasPro: boolean;
    promoCodeId: string;
    serviceDateYmd: string;
    subtotalCents: number;
    customerPhone?: string | null;
    customerEmail?: string | null;
    excludeBookingId: string;
  }
): Promise<BookingDiscountSnapshot | null> {
  if (!params.ownerHasPro || params.subtotalCents <= 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from('promo_codes')
    .select(PROMO_SELECT)
    .eq('id', params.promoCodeId)
    .eq('business_id', params.businessId)
    .maybeSingle();

  if (error) {
    console.error('[marketing] reschedule promo load failed', error);
    return null;
  }

  const promo = tryMapPromoCodeRowToPromoCode(data as PromoCodeRow | null);
  if (!promo || getPromoCodeStatus(promo) !== 'active') return null;
  if (
    (promo.startsAt || promo.endsAt) &&
    !isServiceDateInSaleWindow(promo, params.serviceDateYmd)
  ) {
    return null;
  }

  if (promo.oneUsePerCustomer) {
    const alreadyUsed = await hasCustomerRedeemedPromoCode(db, {
      promoCodeId: promo.id,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      excludeBookingId: params.excludeBookingId,
    });
    if (alreadyUsed) return null;
  }

  const { discountCents } = applyDiscountToSubtotalCents(
    params.subtotalCents,
    promo.discountType,
    promo.discountValue
  );
  if (discountCents <= 0) return null;

  const discountShort = formatPublicSaleDiscountLabel(
    promo.discountType,
    promo.discountValue,
    'off'
  );
  if (!discountShort) return null;

  return {
    discountSource: 'promo',
    discountSaleId: null,
    discountPromoCodeId: promo.id,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    subtotalCents: params.subtotalCents,
    discountCents,
    discountLabel: `${promo.code} — ${discountShort}`,
  };
}

/**
 * After a reschedule date change: keep promo if still eligible, else sale, else clear.
 */
export async function resolveDiscountColumnsForReschedule(
  db: SupabaseClient,
  params: {
    businessId: string;
    ownerHasPro: boolean;
    bookingId: string;
    scheduledDateYmd: string;
    booking: {
      service_price_cents?: number | null;
      addon_details?: unknown;
      job_details?: unknown;
      discount_source?: string | null;
      discount_promo_code_id?: string | null;
      customer_phone?: string | null;
      customer_email?: string | null;
    };
  }
): Promise<ReturnType<typeof bookingDiscountColumnsFromSnapshot>> {
  const subtotalCents = lineSubtotalCents(params.booking);
  const serviceDateYmd = params.scheduledDateYmd.trim();

  if (
    params.booking.discount_source === 'promo' &&
    params.booking.discount_promo_code_id?.trim()
  ) {
    const promo = await resolveExistingPromoOnReschedule(db, {
      businessId: params.businessId,
      ownerHasPro: params.ownerHasPro,
      promoCodeId: params.booking.discount_promo_code_id.trim(),
      serviceDateYmd,
      subtotalCents,
      customerPhone: params.booking.customer_phone,
      customerEmail: params.booking.customer_email,
      excludeBookingId: params.bookingId,
    });
    if (promo) return bookingDiscountColumnsFromSnapshot(promo);
  }

  const sale = await resolveBookingSaleDiscountSnapshot(db, {
    businessId: params.businessId,
    ownerHasPro: params.ownerHasPro,
    serviceDateYmd,
    subtotalCents,
  });
  return bookingDiscountColumnsFromSnapshot(sale);
}
