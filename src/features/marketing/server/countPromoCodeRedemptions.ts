import type { SupabaseClient } from '@supabase/supabase-js';

/** Confirmed uses from `promo_code_redemptions` (written at job completion). */
export async function countPromoCodeRedemptions(
  db: SupabaseClient,
  promoCodeId: string
): Promise<number> {
  const trimmedId = promoCodeId?.trim();
  if (!trimmedId) return 0;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error } = await (db as any)
      .from('promo_code_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('promo_code_id', trimmedId);

    if (error) {
      console.warn('[marketing] countPromoCodeRedemptions failed', error);
      return 0;
    }

    return typeof count === 'number' && Number.isFinite(count) ? count : 0;
  } catch (err) {
    console.warn('[marketing] countPromoCodeRedemptions failed', err);
    return 0;
  }
}
