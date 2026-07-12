import type { SupabaseClient } from '@supabase/supabase-js';
import type { Sale } from '../types';
import { mapSaleRowToSale } from './mapSaleRow';
import type { SaleRow } from './rows';

const SALE_SELECT =
  'id, business_id, name, description, discount_type, discount_value, starts_at, ends_at, is_active, created_at, updated_at';

export type LoadSaleByIdResult =
  | { ok: true; sale: Sale }
  | { ok: false; status: number; error: string };

export async function loadSaleById(
  supabase: SupabaseClient,
  businessId: string,
  saleId: string
): Promise<LoadSaleByIdResult> {
  const trimmedBusinessId = businessId?.trim();
  const trimmedId = saleId?.trim();

  if (!trimmedBusinessId || !trimmedId) {
    return { ok: false, status: 400, error: 'Invalid request' };
  }

  try {
    const { data, error } = await supabase
      .from('sales')
      .select(SALE_SELECT)
      .eq('id', trimmedId)
      .eq('business_id', trimmedBusinessId)
      .maybeSingle();

    if (error) {
      console.error('[marketing] loadSaleById query failed', error);
      return {
        ok: false,
        status: 500,
        error: error.message || 'Failed to load sale',
      };
    }

    if (!data) {
      return { ok: false, status: 404, error: 'Sale not found' };
    }

    const sale = mapSaleRowToSale(data as SaleRow);
    return { ok: true, sale };
  } catch (err) {
    console.error('[marketing] loadSaleById failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Unexpected error loading sale',
    };
  }
}

export type DeleteSaleResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function deleteSale(
  supabase: SupabaseClient,
  businessId: string,
  saleId: string
): Promise<DeleteSaleResult> {
  const trimmedBusinessId = businessId?.trim();
  const trimmedId = saleId?.trim();

  if (!trimmedBusinessId || !trimmedId) {
    return { ok: false, status: 400, error: 'Invalid request' };
  }

  try {
    const { data, error } = await supabase
      .from('sales')
      .delete()
      .eq('id', trimmedId)
      .eq('business_id', trimmedBusinessId)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[marketing] deleteSale failed', error);
      return {
        ok: false,
        status: 500,
        error: error.message || 'Failed to delete sale',
      };
    }

    if (!data) {
      return { ok: false, status: 404, error: 'Sale not found' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[marketing] deleteSale failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Unexpected error deleting sale',
    };
  }
}
