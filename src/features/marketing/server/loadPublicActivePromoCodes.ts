import type { SupabaseClient } from '@supabase/supabase-js';
import type { PublicActivePromoCode } from '../types/publicActivePromoCode';
import { getPromoCodeStatus } from '../utils/getPromoCodeStatus';
import { tryMapPromoCodeRowToPromoCode } from './mapPromoCodeRow';
import type { PromoCodeRedemptionCountRow, PromoCodeRow } from './rows';

const ACTIVE_PROMO_SELECT =
  'id, business_id, code, description, discount_type, discount_value, starts_at, ends_at, one_use_per_customer, is_active, created_at, updated_at';

/**
 * Returns live promo codes for public visitors, or an empty array.
 * Requires owner Pro — free / lapsed owners do not show public promo messaging.
 */
export async function loadPublicActivePromoCodes(
  db: SupabaseClient,
  businessId: string,
  options: { ownerHasPro: boolean }
): Promise<PublicActivePromoCode[]> {
  if (!options.ownerHasPro) return [];

  const trimmedBusinessId = businessId?.trim();
  if (!trimmedBusinessId) return [];

  try {
    const { data, error } = await db
      .from('promo_codes')
      .select(ACTIVE_PROMO_SELECT)
      .eq('business_id', trimmedBusinessId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[marketing] loadPublicActivePromoCodes query failed', error);
      return [];
    }

    const rows = (data ?? []) as PromoCodeRow[];
    if (rows.length === 0) return [];

    const redemptionCounts = await loadRedemptionCounts(db, trimmedBusinessId);

    return rows
      .map(row =>
        tryMapPromoCodeRowToPromoCode(row, redemptionCounts.get(row.id) ?? 0)
      )
      .filter((promoCode): promoCode is NonNullable<typeof promoCode> => {
        return promoCode !== null && getPromoCodeStatus(promoCode) === 'active';
      })
      .map(
        (promoCode): PublicActivePromoCode => ({
          code: promoCode.code,
          description: promoCode.description,
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue,
          startsAt: promoCode.startsAt ?? undefined,
          endsAt: promoCode.endsAt ?? undefined,
        })
      );
  } catch (err) {
    console.error('[marketing] loadPublicActivePromoCodes failed', err);
    return [];
  }
}

async function loadRedemptionCounts(
  db: SupabaseClient,
  businessId: string
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  const { data, error } = await db
    .from('promo_code_redemptions')
    .select('promo_code_id')
    .eq('business_id', businessId);

  if (error) {
    console.warn('[marketing] loadPublicActivePromoCodes redemption counts failed', error);
    return counts;
  }

  for (const row of (data ?? []) as PromoCodeRedemptionCountRow[]) {
    const id = row.promo_code_id?.trim();
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return counts;
}
