/**
 * Add-ons API - Create a new add-on.
 * Server-only; use from server actions or route handlers.
 * Add-ons are created in the business pool; they're assigned to services when editing each service.
 */

import type { Database } from '@/libs/supabase/client';
import { sanitizeDbError } from '@/utils/sanitizeDbError';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AddOnRow } from '../../components/add-ons/addOnTypes';

export interface CreateAddOnPayload {
  name: string;
  price_cents: number;
}

export interface CreateAddOnResult {
  success: boolean;
  data: AddOnRow | null;
  error: string | null;
}

/**
 * Creates a new add-on in the business add-on pool (no service assignment).
 */
export async function createAddOn(
  supabase: SupabaseClient<Database>,
  businessId: string,
  payload: CreateAddOnPayload
): Promise<CreateAddOnResult> {
  try {
    type TableInsert = Database['public']['Tables']['service_addons']['Insert'];

    const insertPayload: TableInsert = {
      business_id: businessId,
      name: payload.name.trim(),
      price_cents: payload.price_cents,
    };

    const { data, error } = await supabase
      .from('service_addons')
      .insert(insertPayload as never)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        data: null,
        error: sanitizeDbError(
          error.message,
          'Failed to create add-on. Please try again.'
        ),
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
      error: sanitizeDbError(
        message,
        'Failed to create add-on. Please try again.'
      ),
    };
  }
}
