import type { SupabaseClient } from '@supabase/supabase-js';
import type { PromoCode } from '../types';
import { countPromoCodeRedemptions } from './countPromoCodeRedemptions';
import { mapPromoCodeRowToPromoCode } from './mapPromoCodeRow';
import type { PromoCodeRow } from './rows';

const PROMO_CODE_SELECT =
  'id, business_id, code, description, discount_type, discount_value, starts_at, ends_at, one_use_per_customer, is_active, created_at, updated_at';

export type LoadPromoCodeByIdResult =
  | { ok: true; promoCode: PromoCode }
  | { ok: false; status: number; error: string };

export async function loadPromoCodeById(
  supabase: SupabaseClient,
  businessId: string,
  promoCodeId: string
): Promise<LoadPromoCodeByIdResult> {
  const trimmedBusinessId = businessId?.trim();
  const trimmedId = promoCodeId?.trim();

  if (!trimmedBusinessId || !trimmedId) {
    return { ok: false, status: 400, error: 'Invalid request' };
  }

  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select(PROMO_CODE_SELECT)
      .eq('id', trimmedId)
      .eq('business_id', trimmedBusinessId)
      .maybeSingle();

    if (error) {
      console.error('[marketing] loadPromoCodeById query failed', error);
      return {
        ok: false,
        status: 500,
        error: error.message || 'Failed to load promo code',
      };
    }

    if (!data) {
      return { ok: false, status: 404, error: 'Promo code not found' };
    }

    const redemptionCount = await countPromoCodeRedemptions(
      supabase,
      trimmedId
    );

    const promoCode = mapPromoCodeRowToPromoCode(
      data as PromoCodeRow,
      redemptionCount
    );

    return { ok: true, promoCode };
  } catch (err) {
    console.error('[marketing] loadPromoCodeById failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Unexpected error loading promo code',
    };
  }
}

export type DeletePromoCodeResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function deletePromoCode(
  supabase: SupabaseClient,
  businessId: string,
  promoCodeId: string
): Promise<DeletePromoCodeResult> {
  const trimmedBusinessId = businessId?.trim();
  const trimmedId = promoCodeId?.trim();

  if (!trimmedBusinessId || !trimmedId) {
    return { ok: false, status: 400, error: 'Invalid request' };
  }

  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', trimmedId)
      .eq('business_id', trimmedBusinessId)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[marketing] deletePromoCode failed', error);
      return {
        ok: false,
        status: 500,
        error: error.message || 'Failed to delete promo code',
      };
    }

    if (!data) {
      return { ok: false, status: 404, error: 'Promo code not found' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[marketing] deletePromoCode failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Unexpected error deleting promo code',
    };
  }
}
