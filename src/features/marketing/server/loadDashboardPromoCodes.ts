import type { SupabaseClient } from '@supabase/supabase-js';
import type { PromoCode } from '../types';
import { tryMapPromoCodeRowToPromoCode } from './mapPromoCodeRow';
import type { PromoCodeRedemptionCountRow, PromoCodeRow } from './rows';

const DEFAULT_LIMIT = 100;

export type LoadDashboardPromoCodesResult =
  | { ok: true; promoCodes: PromoCode[] }
  | { ok: false; status: number; error: string };

const PROMO_CODE_SELECT =
  'id, business_id, code, description, discount_type, discount_value, starts_at, ends_at, one_use_per_customer, is_active, created_at, updated_at';

export async function loadDashboardPromoCodes(
  supabase: SupabaseClient,
  businessId: string,
  options?: { limit?: number }
): Promise<LoadDashboardPromoCodesResult> {
  const trimmedBusinessId = businessId?.trim();
  if (!trimmedBusinessId) {
    return { ok: false, status: 400, error: 'businessId is required' };
  }

  const limit = options?.limit ?? DEFAULT_LIMIT;

  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select(PROMO_CODE_SELECT)
      .eq('business_id', trimmedBusinessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[marketing] loadDashboardPromoCodes query failed', error);
      return {
        ok: false,
        status: 500,
        error: error.message || 'Failed to load promo codes',
      };
    }

    const rows = (data ?? []) as PromoCodeRow[];
    const redemptionCounts = await loadRedemptionCounts(
      supabase,
      trimmedBusinessId
    );

    const promoCodes = rows
      .map(row =>
        tryMapPromoCodeRowToPromoCode(row, redemptionCounts.get(row.id) ?? 0)
      )
      .filter((promoCode): promoCode is PromoCode => promoCode !== null);

    return { ok: true, promoCodes };
  } catch (err) {
    console.error('[marketing] loadDashboardPromoCodes failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Unexpected error loading promo codes',
    };
  }
}

async function loadRedemptionCounts(
  supabase: SupabaseClient,
  businessId: string
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  const { data, error } = await supabase
    .from('promo_code_redemptions')
    .select('promo_code_id')
    .eq('business_id', businessId);

  if (error) {
    console.warn('[marketing] loadRedemptionCounts failed', error);
    return counts;
  }

  for (const row of (data ?? []) as PromoCodeRedemptionCountRow[]) {
    const id = row.promo_code_id?.trim();
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return counts;
}
