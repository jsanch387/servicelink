/**
 * Add-ons API - Update an existing add-on.
 * Server-only; use from server actions or route handlers.
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AddOnRow } from '../../components/add-ons/addOnTypes';

export interface UpdateAddOnPayload {
  name: string;
  price_cents: number;
}

export interface UpdateAddOnResult {
  success: boolean;
  data: AddOnRow | null;
  error: string | null;
}

/**
 * Updates an add-on by id, scoped to the given business.
 * updated_at is set automatically by DB trigger.
 */
export async function updateAddOn(
  supabase: SupabaseClient<Database>,
  addonId: string,
  businessId: string,
  payload: UpdateAddOnPayload
): Promise<UpdateAddOnResult> {
  try {
    type TableUpdate = Database['public']['Tables']['service_addons']['Update'];
    const updatePayload: TableUpdate = {
      name: payload.name.trim(),
      price_cents: payload.price_cents,
    };

    const { data, error } = await supabase
      .from('service_addons')
      .update(updatePayload as never)
      .eq('id', addonId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          data: null,
          error: 'Add-on not found or you don’t have permission to update it.',
        };
      }
      return {
        success: false,
        data: null,
        error: error.message ?? 'Failed to update add-on',
      };
    }

    const row = data as Database['public']['Tables']['service_addons']['Row'];

    const addOn: AddOnRow = {
      id: row.id,
      name: row.name,
      price_cents: row.price_cents ?? 0,
      sort_order: null,
    };

    return {
      success: true,
      data: addOn,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred';
    return {
      success: false,
      data: null,
      error: message,
    };
  }
}
