/**
 * Services API - Save services sort order.
 * Server-only; use from server actions or route handlers.
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UpdateServicesOrderResult } from '../types/services';

/**
 * Updates sort_order for each service to match the given order.
 * orderedIds[0] gets sort_order 0, orderedIds[1] gets 1, etc.
 */
export async function updateServicesOrder(
  supabase: SupabaseClient<Database>,
  businessId: string,
  orderedIds: string[]
): Promise<UpdateServicesOrderResult> {
  try {
    type TableUpdate =
      Database['public']['Tables']['business_services']['Update'];

    for (let i = 0; i < orderedIds.length; i++) {
      const payload: TableUpdate = {
        sort_order: i,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('business_services')
        .update(payload as never)
        .eq('id', orderedIds[i])
        .eq('business_id', businessId);

      if (error) {
        return {
          success: false,
          error:
            error.message ?? 'Failed to save sort order. Please try again.',
        };
      }
    }

    return { success: true, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred';
    return {
      success: false,
      error: message,
    };
  }
}
