/**
 * Services API - Delete a service.
 * Server-only; use from server actions or route handlers.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/libs/supabase/client';
import type { DeleteServiceResult } from '../types/services';

/**
 * Deletes a service by id, scoped to the given business.
 */
export async function deleteService(
  supabase: SupabaseClient<Database>,
  serviceId: string,
  businessId: string
): Promise<DeleteServiceResult> {
  try {
    const { error } = await supabase
      .from('business_services')
      .delete()
      .eq('id', serviceId)
      .eq('business_id', businessId);

    if (error) {
      return {
        success: false,
        error: error.message ?? 'Failed to delete service',
      };
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
