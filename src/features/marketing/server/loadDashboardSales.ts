import type { SupabaseClient } from '@supabase/supabase-js';
import type { Sale } from '../types';
import { tryMapSaleRowToSale } from './mapSaleRow';
import type { SaleRow } from './rows';

const DEFAULT_LIMIT = 100;

export type LoadDashboardSalesResult =
  | { ok: true; sales: Sale[] }
  | { ok: false; status: number; error: string };

const SALE_SELECT =
  'id, business_id, name, description, discount_type, discount_value, starts_at, ends_at, is_active, created_at, updated_at';

export async function loadDashboardSales(
  supabase: SupabaseClient,
  businessId: string,
  options?: { limit?: number }
): Promise<LoadDashboardSalesResult> {
  const trimmedBusinessId = businessId?.trim();
  if (!trimmedBusinessId) {
    return { ok: false, status: 400, error: 'businessId is required' };
  }

  const limit = options?.limit ?? DEFAULT_LIMIT;

  try {
    const { data, error } = await supabase
      .from('sales')
      .select(SALE_SELECT)
      .eq('business_id', trimmedBusinessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[marketing] loadDashboardSales query failed', error);
      return {
        ok: false,
        status: 500,
        error: error.message || 'Failed to load sales',
      };
    }

    const rows = (data ?? []) as SaleRow[];
    const sales = rows
      .map(row => tryMapSaleRowToSale(row))
      .filter((sale): sale is Sale => sale !== null);

    return { ok: true, sales };
  } catch (err) {
    console.error('[marketing] loadDashboardSales failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Unexpected error loading sales',
    };
  }
}
