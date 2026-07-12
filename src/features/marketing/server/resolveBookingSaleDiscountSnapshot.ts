import type { SupabaseClient } from '@supabase/supabase-js';
import type { DiscountType } from '../types';
import { applyDiscountToSubtotalCents } from '../utils/applyDiscountToSubtotalCents';
import { formatPublicSaleDiscountLabel } from '../utils/formatPublicSaleDiscountLabel';
import { isServiceDateInSaleWindow } from '../utils/isServiceDateInSaleWindow';
import { getSaleStatus } from '../utils/getSaleStatus';
import { tryMapSaleRowToSale } from './mapSaleRow';
import type { SaleRow } from './rows';

const ACTIVE_SALE_SELECT =
  'id, business_id, name, description, discount_type, discount_value, starts_at, ends_at, is_active, created_at, updated_at';

/** Snapshot persisted on `bookings` at create time (sale auto-apply for v1). */
export type BookingDiscountSnapshot = {
  discountSource: 'sale';
  discountSaleId: string;
  discountPromoCodeId: null;
  discountType: DiscountType;
  discountValue: number;
  subtotalCents: number;
  discountCents: number;
  /** Display label, e.g. "Summer Sale — 35% off". */
  discountLabel: string;
};

/**
 * Resolves an auto-applied sale for a booking create.
 * Server-side only — do not trust client discount amounts.
 */
export async function resolveBookingSaleDiscountSnapshot(
  db: SupabaseClient,
  params: {
    businessId: string;
    ownerHasPro: boolean;
    serviceDateYmd: string;
    subtotalCents: number;
  }
): Promise<BookingDiscountSnapshot | null> {
  if (!params.ownerHasPro) return null;

  const businessId = params.businessId?.trim();
  const serviceDateYmd = params.serviceDateYmd?.trim();
  const subtotalCents = Number.isFinite(params.subtotalCents)
    ? Math.max(0, Math.round(params.subtotalCents))
    : 0;

  if (!businessId || !serviceDateYmd || subtotalCents <= 0) return null;

  try {
    const { data, error } = await db
      .from('sales')
      .select(ACTIVE_SALE_SELECT)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error(
        '[marketing] resolveBookingSaleDiscountSnapshot query failed',
        error
      );
      return null;
    }

    const sale = tryMapSaleRowToSale(data as SaleRow | null);
    if (!sale || getSaleStatus(sale) !== 'active') return null;
    if (!isServiceDateInSaleWindow(sale, serviceDateYmd)) return null;

    const { discountCents } = applyDiscountToSubtotalCents(
      subtotalCents,
      sale.discountType,
      sale.discountValue
    );
    if (discountCents <= 0) return null;

    const discountShort = formatPublicSaleDiscountLabel(
      sale.discountType,
      sale.discountValue,
      'off'
    );
    if (!discountShort) return null;

    return {
      discountSource: 'sale',
      discountSaleId: sale.id,
      discountPromoCodeId: null,
      discountType: sale.discountType,
      discountValue: sale.discountValue,
      subtotalCents,
      discountCents,
      discountLabel: `${sale.name} — ${discountShort}`,
    };
  } catch (err) {
    console.error('[marketing] resolveBookingSaleDiscountSnapshot failed', err);
    return null;
  }
}

export function bookingDiscountColumnsFromSnapshot(
  snapshot: BookingDiscountSnapshot | null | undefined
): {
  discount_source: 'sale' | null;
  discount_sale_id: string | null;
  discount_promo_code_id: null;
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
    discount_promo_code_id: null,
    discount_type: snapshot.discountType,
    discount_value: snapshot.discountValue,
    subtotal_cents: snapshot.subtotalCents,
    discount_cents: snapshot.discountCents,
    discount_label: snapshot.discountLabel,
  };
}
