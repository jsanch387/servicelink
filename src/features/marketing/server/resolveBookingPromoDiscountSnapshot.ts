import type { SupabaseClient } from '@supabase/supabase-js';
import { PROMO_CODE_MAX_LENGTH } from '../constants/limits';
import { applyDiscountToSubtotalCents } from '../utils/applyDiscountToSubtotalCents';
import { formatPublicSaleDiscountLabel } from '../utils/formatPublicSaleDiscountLabel';
import { getPromoCodeStatus } from '../utils/getPromoCodeStatus';
import { isServiceDateInSaleWindow } from '../utils/isServiceDateInSaleWindow';
import type { BookingDiscountSnapshot } from './bookingDiscountSnapshot';
import { hasCustomerRedeemedPromoCode } from './hasCustomerRedeemedPromoCode';
import { tryMapPromoCodeRowToPromoCode } from './mapPromoCodeRow';
import type { PromoCodeRow } from './rows';

const PROMO_SELECT =
  'id, business_id, code, description, discount_type, discount_value, starts_at, ends_at, one_use_per_customer, is_active, created_at, updated_at';

export type PromoDiscountResolveError =
  | 'invalid'
  | 'inactive'
  | 'scheduled'
  | 'expired'
  | 'already_used'
  | 'identity_required'
  | 'unavailable';

export type ResolvePromoDiscountResult =
  | { ok: true; snapshot: BookingDiscountSnapshot }
  | { ok: false; error: PromoDiscountResolveError };

export function normalizeEnteredPromoCode(
  raw: string | null | undefined
): string {
  return (raw ?? '').trim().toUpperCase();
}

export function isValidPromoCodeFormat(code: string): boolean {
  return (
    code.length > 0 &&
    code.length <= PROMO_CODE_MAX_LENGTH &&
    /^[A-Z0-9]+$/.test(code)
  );
}

/**
 * Resolves a customer-entered promo code into a booking discount snapshot.
 * Server-side only — do not trust client discount amounts.
 */
export async function resolveBookingPromoDiscountSnapshot(
  db: SupabaseClient,
  params: {
    businessId: string;
    ownerHasPro: boolean;
    promoCode: string;
    serviceDateYmd: string;
    subtotalCents: number;
    customerPhone?: string | null;
    customerEmail?: string | null;
  }
): Promise<ResolvePromoDiscountResult> {
  if (!params.ownerHasPro) {
    return { ok: false, error: 'unavailable' };
  }

  const businessId = params.businessId?.trim();
  const serviceDateYmd = params.serviceDateYmd?.trim();
  const code = normalizeEnteredPromoCode(params.promoCode);
  const subtotalCents = Number.isFinite(params.subtotalCents)
    ? Math.max(0, Math.round(params.subtotalCents))
    : 0;

  if (!businessId || !serviceDateYmd || subtotalCents <= 0) {
    return { ok: false, error: 'invalid' };
  }
  if (!isValidPromoCodeFormat(code)) {
    return { ok: false, error: 'invalid' };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (db as any)
      .from('promo_codes')
      .select(PROMO_SELECT)
      .eq('business_id', businessId)
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error(
        '[marketing] resolveBookingPromoDiscountSnapshot query failed',
        error
      );
      return { ok: false, error: 'unavailable' };
    }

    const promo = tryMapPromoCodeRowToPromoCode(data as PromoCodeRow | null);
    if (!promo || promo.code.toUpperCase() !== code) {
      return { ok: false, error: 'invalid' };
    }

    const status = getPromoCodeStatus(promo);
    if (status === 'inactive') return { ok: false, error: 'inactive' };
    if (status === 'scheduled') return { ok: false, error: 'scheduled' };
    if (status === 'expired') return { ok: false, error: 'expired' };
    if (status !== 'active') return { ok: false, error: 'invalid' };

    if (
      (promo.startsAt || promo.endsAt) &&
      !isServiceDateInSaleWindow(promo, serviceDateYmd)
    ) {
      return { ok: false, error: 'expired' };
    }

    if (promo.oneUsePerCustomer) {
      const phone = params.customerPhone?.trim() ?? '';
      const email = params.customerEmail?.trim() ?? '';
      if (!phone && !email) {
        return { ok: false, error: 'identity_required' };
      }
      const alreadyUsed = await hasCustomerRedeemedPromoCode(db, {
        promoCodeId: promo.id,
        customerPhone: phone || null,
        customerEmail: email || null,
      });
      if (alreadyUsed) {
        return { ok: false, error: 'already_used' };
      }
    }

    const { discountCents } = applyDiscountToSubtotalCents(
      subtotalCents,
      promo.discountType,
      promo.discountValue
    );
    if (discountCents <= 0) {
      return { ok: false, error: 'invalid' };
    }

    const discountShort = formatPublicSaleDiscountLabel(
      promo.discountType,
      promo.discountValue,
      'off'
    );
    if (!discountShort) {
      return { ok: false, error: 'invalid' };
    }

    return {
      ok: true,
      snapshot: {
        discountSource: 'promo',
        discountSaleId: null,
        discountPromoCodeId: promo.id,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        subtotalCents,
        discountCents,
        discountLabel: `${promo.code} — ${discountShort}`,
      },
    };
  } catch (err) {
    console.error(
      '[marketing] resolveBookingPromoDiscountSnapshot failed',
      err
    );
    return { ok: false, error: 'unavailable' };
  }
}
