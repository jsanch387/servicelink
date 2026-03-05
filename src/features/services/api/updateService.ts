/**
 * Services API - Update a single service.
 * Server-only; use from server actions or route handlers.
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ServiceRow,
  UpdateServicePayload,
  UpdateServiceResult,
} from '../types/services';

/**
 * Updates a service by id, scoped to the given business.
 * Returns the updated row or an error (e.g. not found, RLS, DB error).
 */
export async function updateService(
  supabase: SupabaseClient<Database>,
  serviceId: string,
  businessId: string,
  payload: UpdateServicePayload
): Promise<UpdateServiceResult> {
  try {
    type TableUpdate =
      Database['public']['Tables']['business_services']['Update'];
    const updatePayload: TableUpdate = {
      name: payload.name,
      description: payload.description || null,
      price_cents: payload.price_cents,
      duration_minutes: payload.duration_minutes,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('business_services')
      .update(updatePayload as never)
      .eq('id', serviceId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          data: null,
          error: 'Service not found or you don’t have permission to update it.',
        };
      }
      return {
        success: false,
        data: null,
        error: error.message ?? 'Failed to update service',
      };
    }

    return {
      success: true,
      data: data as ServiceRow,
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
