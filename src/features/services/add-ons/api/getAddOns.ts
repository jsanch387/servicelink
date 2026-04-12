/**
 * Add-ons API - Fetch add-ons for a business.
 * Server-only; use from server components or route handlers.
 * Returns add-ons from the business pool (no service assignment here).
 */

import type { Database } from '@/libs/supabase/client';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { sanitizeDbError } from '@/utils/sanitizeDbError';
import type { AddOnRow } from '../../components/add-ons/addOnTypes';

type ServiceAddOnRow = Database['public']['Tables']['service_addons']['Row'];

export interface GetAddOnsResult {
  success: boolean;
  data: AddOnRow[] | null;
  error: string | null;
}

/** Maps DB row to AddOnRow for UI. */
function mapToAddOnRow(row: ServiceAddOnRow): AddOnRow {
  return {
    id: row.id,
    name: row.name,
    price_cents: row.price_cents ?? 0,
    duration_minutes: row.duration_minutes ?? null,
    sort_order: null,
  };
}

/**
 * Fetches all add-ons in the business pool.
 * Ordered by created_at ascending.
 */
export async function getAddOns(businessId: string): Promise<GetAddOnsResult> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('service_addons')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true });

    if (error) {
      return {
        success: false,
        data: null,
        error: sanitizeDbError(
          error.message,
          'Failed to load add-ons. Please try again.'
        ),
      };
    }

    const addOns = (data ?? []).map(mapToAddOnRow);

    return {
      success: true,
      data: addOns,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred';
    return {
      success: false,
      data: null,
      error: sanitizeDbError(
        message,
        'Failed to load add-ons. Please try again.'
      ),
    };
  }
}
