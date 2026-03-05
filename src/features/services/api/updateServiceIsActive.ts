/**
 * Services API - Update a service's is_active flag.
 * Server-only; use from server actions or route handlers.
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UpdateServiceIsActiveResult } from '../types/services';

/**
 * Updates only is_active (and updated_at) for a service, scoped to the business.
 */
export async function updateServiceIsActive(
  supabase: SupabaseClient<Database>,
  serviceId: string,
  businessId: string,
  isActive: boolean
): Promise<UpdateServiceIsActiveResult> {
  try {
    type TableUpdate =
      Database['public']['Tables']['business_services']['Update'];
    const updatePayload: TableUpdate = {
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('business_services')
      .update(updatePayload as never)
      .eq('id', serviceId)
      .eq('business_id', businessId);

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Service not found or you don’t have permission to update it.',
        };
      }
      return {
        success: false,
        error: error.message ?? 'Failed to update service visibility',
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
