import type { SupabaseClient } from '@supabase/supabase-js';
import type { PublicActiveSale } from '../types/publicActiveSale';
import { tryMapSaleRowToSale } from './mapSaleRow';
import type { SaleRow } from './rows';

const ACTIVE_SALE_SELECT =
  'id, business_id, name, description, discount_type, discount_value, starts_at, ends_at, is_active, created_at, updated_at';

/**
 * Sale available for the owner create-appointment review toggle.
 * Uses `is_active` only — same qualification as booking sale resolve
 * (appointment date window is checked when Apply is on). Does not require
 * Pro for the UI toggle; the create API still enforces plan rules.
 */
export async function loadOwnerBookingSale(
  db: SupabaseClient,
  businessId: string
): Promise<PublicActiveSale | null> {
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
      console.error('[marketing] loadOwnerBookingSale query failed', error);
      return null;
    }

    const sale = tryMapSaleRowToSale(data as SaleRow | null);
    if (!sale || !sale.isActive) return null;

    return {
      name: sale.name,
      description: sale.description,
      discountType: sale.discountType,
      discountValue: sale.discountValue,
      startsAt: sale.startsAt ?? undefined,
      endsAt: sale.endsAt ?? undefined,
    };
  } catch (err) {
    console.error('[marketing] loadOwnerBookingSale failed', err);
    return null;
  }
}
