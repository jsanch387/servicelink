import type { SupabaseClient } from '@supabase/supabase-js';
import type { PublicActiveSale } from '../types/publicActiveSale';
import { getSaleStatus } from '../utils/getSaleStatus';
import { tryMapSaleRowToSale } from './mapSaleRow';
import type { SaleRow } from './rows';

const ACTIVE_SALE_SELECT =
  'id, business_id, name, description, discount_type, discount_value, starts_at, ends_at, is_active, created_at, updated_at';

/**
 * Returns the business's currently live sale for public visitors, or null.
 * Requires owner Pro — free / lapsed owners do not show public sale messaging.
 */
export async function loadPublicActiveSale(
  db: SupabaseClient,
  businessId: string,
  options: { ownerHasPro: boolean }
): Promise<PublicActiveSale | null> {
  if (!options.ownerHasPro) return null;

  const trimmedBusinessId = businessId?.trim();
  if (!trimmedBusinessId) return null;

  try {
    const { data, error } = await db
      .from('sales')
      .select(ACTIVE_SALE_SELECT)
      .eq('business_id', trimmedBusinessId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[marketing] loadPublicActiveSale query failed', error);
      return null;
    }

    const sale = tryMapSaleRowToSale(data as SaleRow | null);
    if (!sale || getSaleStatus(sale) !== 'active') {
      return null;
    }

    return {
      name: sale.name,
      description: sale.description,
      discountType: sale.discountType,
      discountValue: sale.discountValue,
      startsAt: sale.startsAt,
      endsAt: sale.endsAt,
    };
  } catch (err) {
    console.error('[marketing] loadPublicActiveSale failed', err);
    return null;
  }
}
