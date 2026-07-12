import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreatePromoCodePayload } from '../api/types';
import type { PromoCode } from '../types';
import { dateInputToEndsAtIso, dateInputToStartsAtIso } from './dateUtils';
import { countPromoCodeRedemptions } from './countPromoCodeRedemptions';
import { mapPromoCodeRowToPromoCode } from './mapPromoCodeRow';
import type { PromoCodeRow } from './rows';

export type UpdatePromoCodeResult =
  | { ok: true; promoCode: PromoCode }
  | { ok: false; status: number; error: string };

const PROMO_CODE_SELECT =
  'id, business_id, code, description, discount_type, discount_value, starts_at, ends_at, one_use_per_customer, is_active, created_at, updated_at';

function toDbTimestamps(payload: CreatePromoCodePayload): {
  starts_at: string | null;
  ends_at: string | null;
} {
  if (!payload.startsAt || !payload.endsAt) {
    return { starts_at: null, ends_at: null };
  }

  return {
    starts_at: dateInputToStartsAtIso(payload.startsAt),
    ends_at: dateInputToEndsAtIso(payload.endsAt),
  };
}

export async function updatePromoCode(
  supabase: SupabaseClient,
  businessId: string,
  promoCodeId: string,
  payload: CreatePromoCodePayload
): Promise<UpdatePromoCodeResult> {
  const trimmedBusinessId = businessId?.trim();
  const trimmedId = promoCodeId?.trim();

  if (!trimmedBusinessId || !trimmedId) {
    return { ok: false, status: 400, error: 'Invalid request' };
  }

  const { starts_at, ends_at } = toDbTimestamps(payload);

  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .update({
        code: payload.code,
        description: payload.description,
        discount_type: payload.discountType,
        discount_value: payload.discountValue,
        starts_at,
        ends_at,
        one_use_per_customer: payload.oneUsePerCustomer,
        is_active: payload.isActive,
      })
      .eq('id', trimmedId)
      .eq('business_id', trimmedBusinessId)
      .select(PROMO_CODE_SELECT)
      .maybeSingle();

    if (error) {
      console.error('[marketing] updatePromoCode failed', error);
      if (error.code === '23505') {
        return {
          ok: false,
          status: 409,
          error: 'A promo code with this name already exists',
        };
      }
      return {
        ok: false,
        status: 500,
        error: error.message || 'Failed to update promo code',
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
    console.error('[marketing] updatePromoCode failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Unexpected error updating promo code',
    };
  }
}
