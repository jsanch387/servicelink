import type { SupabaseClient } from '@supabase/supabase-js';
import { applyDiscountToSubtotalCents } from '../utils/applyDiscountToSubtotalCents';
import { formatPublicSaleDiscountLabel } from '../utils/formatPublicSaleDiscountLabel';
import { isServiceDateInSaleWindow } from '../utils/isServiceDateInSaleWindow';
import { getSaleStatus } from '../utils/getSaleStatus';
import type { BookingDiscountSnapshot } from './bookingDiscountSnapshot';
import { tryMapSaleRowToSale } from './mapSaleRow';
import type { SaleRow } from './rows';

export type { BookingDiscountSnapshot } from './bookingDiscountSnapshot';
export { bookingDiscountColumnsFromSnapshot } from './bookingDiscountSnapshot';

const ACTIVE_SALE_SELECT =
  'id, business_id, name, description, discount_type, discount_value, starts_at, ends_at, is_active, created_at, updated_at';

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
