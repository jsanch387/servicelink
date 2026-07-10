import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateSalePayload } from '../api/types';
import type { Sale } from '../types';
import { dateInputToEndsAtIso, dateInputToStartsAtIso } from './dateUtils';
import { mapSaleRowToSale } from './mapSaleRow';
import type { SaleRow } from './rows';

export type CreateSaleResult =
  | { ok: true; sale: Sale }
  | { ok: false; status: number; error: string };

const SALE_SELECT =
  'id, business_id, name, description, discount_type, discount_value, starts_at, ends_at, is_active, created_at, updated_at';

export async function createSale(
  supabase: SupabaseClient,
  businessId: string,
  payload: CreateSalePayload
): Promise<CreateSaleResult> {
  const trimmedBusinessId = businessId?.trim();
  if (!trimmedBusinessId) {
    return { ok: false, status: 400, error: 'businessId is required' };
  }

  try {
    if (payload.isActive) {
      const deactivateResult = await supabase
        .from('sales')
        .update({ is_active: false })
        .eq('business_id', trimmedBusinessId)
        .eq('is_active', true);

      if (deactivateResult.error) {
        console.error(
          '[marketing] createSale deactivate existing failed',
          deactivateResult.error
        );
        return {
          ok: false,
          status: 500,
          error: 'Failed to prepare sale activation',
        };
      }
    }

    const { data, error } = await supabase
      .from('sales')
      .insert({
        business_id: trimmedBusinessId,
        name: payload.name,
        description: payload.description,
        discount_type: payload.discountType,
        discount_value: payload.discountValue,
        starts_at: payload.startsAt
          ? dateInputToStartsAtIso(payload.startsAt)
          : null,
        ends_at: payload.endsAt ? dateInputToEndsAtIso(payload.endsAt) : null,
        is_active: payload.isActive,
      })
      .select(SALE_SELECT)
      .single();

    if (error) {
      console.error('[marketing] createSale insert failed', error);
      if (error.code === '23505') {
        return {
          ok: false,
          status: 409,
          error: 'Only one sale can be active at a time',
        };
      }
      return {
        ok: false,
        status: 500,
        error: error.message || 'Failed to create sale',
      };
    }

    const sale = mapSaleRowToSale(data as SaleRow);
    return { ok: true, sale };
  } catch (err) {
    console.error('[marketing] createSale failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Unexpected error creating sale',
    };
  }
}

export async function toggleSaleActive(
  supabase: SupabaseClient,
  businessId: string,
  saleId: string,
  isActive: boolean
): Promise<CreateSaleResult> {
  const trimmedBusinessId = businessId?.trim();
  const trimmedId = saleId?.trim();

  if (!trimmedBusinessId || !trimmedId) {
    return { ok: false, status: 400, error: 'Invalid request' };
  }

  try {
    if (isActive) {
      const deactivateResult = await supabase
        .from('sales')
        .update({ is_active: false })
        .eq('business_id', trimmedBusinessId)
        .eq('is_active', true)
        .neq('id', trimmedId);

      if (deactivateResult.error) {
        console.error(
          '[marketing] toggleSaleActive deactivate others failed',
          deactivateResult.error
        );
        return {
          ok: false,
          status: 500,
          error: 'Failed to prepare sale activation',
        };
      }
    }

    const { data, error } = await supabase
      .from('sales')
      .update({ is_active: isActive })
      .eq('id', trimmedId)
      .eq('business_id', trimmedBusinessId)
      .select(SALE_SELECT)
      .maybeSingle();

    if (error) {
      console.error('[marketing] toggleSaleActive failed', error);
      if (error.code === '23505') {
        return {
          ok: false,
          status: 409,
          error: 'Only one sale can be active at a time',
        };
      }
      return {
        ok: false,
        status: 500,
        error: error.message || 'Failed to update sale',
      };
    }

    if (!data) {
      return { ok: false, status: 404, error: 'Sale not found' };
    }

    const sale = mapSaleRowToSale(data as SaleRow);
    return { ok: true, sale };
  } catch (err) {
    console.error('[marketing] toggleSaleActive failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Unexpected error updating sale',
    };
  }
}
