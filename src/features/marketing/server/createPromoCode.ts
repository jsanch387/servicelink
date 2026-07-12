import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreatePromoCodePayload } from '../api/types';
import type { PromoCode } from '../types';
import { dateInputToEndsAtIso, dateInputToStartsAtIso } from './dateUtils';
import { countPromoCodeRedemptions } from './countPromoCodeRedemptions';
import { mapPromoCodeRowToPromoCode } from './mapPromoCodeRow';
import type { PromoCodeRow } from './rows';

export type CreatePromoCodeResult =
  | { ok: true; promoCode: PromoCode }
  | { ok: false; status: number; error: string };

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

export async function createPromoCode(
  supabase: SupabaseClient,
  businessId: string,
  payload: CreatePromoCodePayload
): Promise<CreatePromoCodeResult> {
  const trimmedBusinessId = businessId?.trim();
  if (!trimmedBusinessId) {
    return { ok: false, status: 400, error: 'businessId is required' };
  }

  const { starts_at, ends_at } = toDbTimestamps(payload);

  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        business_id: trimmedBusinessId,
        code: payload.code,
        description: payload.description,
        discount_type: payload.discountType,
        discount_value: payload.discountValue,
        starts_at,
        ends_at,
        one_use_per_customer: payload.oneUsePerCustomer,
        is_active: payload.isActive,
      })
      .select(
        'id, business_id, code, description, discount_type, discount_value, starts_at, ends_at, one_use_per_customer, is_active, created_at, updated_at'
      )
      .single();

    if (error) {
      console.error('[marketing] createPromoCode insert failed', error);
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
        error: error.message || 'Failed to create promo code',
      };
    }

    const promoCode = mapPromoCodeRowToPromoCode(data as PromoCodeRow, 0);
    return { ok: true, promoCode };
  } catch (err) {
    console.error('[marketing] createPromoCode failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Unexpected error creating promo code',
    };
  }
}

export async function togglePromoCodeActive(
  supabase: SupabaseClient,
  businessId: string,
  promoCodeId: string,
  isActive: boolean
): Promise<CreatePromoCodeResult> {
  const trimmedBusinessId = businessId?.trim();
  const trimmedId = promoCodeId?.trim();

  if (!trimmedBusinessId || !trimmedId) {
    return { ok: false, status: 400, error: 'Invalid request' };
  }

  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .update({ is_active: isActive })
      .eq('id', trimmedId)
      .eq('business_id', trimmedBusinessId)
      .select(
        'id, business_id, code, description, discount_type, discount_value, starts_at, ends_at, one_use_per_customer, is_active, created_at, updated_at'
      )
      .maybeSingle();

    if (error) {
      console.error('[marketing] togglePromoCodeActive failed', error);
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
    console.error('[marketing] togglePromoCodeActive failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Unexpected error updating promo code',
    };
  }
}
