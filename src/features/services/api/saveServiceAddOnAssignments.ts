/**
 * Services API - Save add-on assignments for a service.
 * Replaces all assignments for the service with the given addon IDs.
 * Server-only; use from server actions or route handlers.
 */

import type { Database } from '@/libs/supabase/client';
import { sanitizeDbError } from '@/utils/sanitizeDbError';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface SaveServiceAddOnAssignmentsResult {
  success: boolean;
  error: string | null;
}

/**
 * Replaces service_addon_assignments for the given service with the given addon IDs.
 * RLS ensures the user can only assign add-ons from their business pool to their services.
 */
export async function saveServiceAddOnAssignments(
  supabase: SupabaseClient<Database>,
  serviceId: string,
  addonIds: string[]
): Promise<SaveServiceAddOnAssignmentsResult> {
  try {
    const { error: deleteError } = await supabase
      .from('service_addon_assignments')
      .delete()
      .eq('service_id', serviceId);

    if (deleteError) {
      return {
        success: false,
        error: sanitizeDbError(
          deleteError.message,
          'Failed to save add-on selection. Please try again.'
        ),
      };
    }

    if (addonIds.length === 0) {
      return { success: true, error: null };
    }

    type Insert =
      Database['public']['Tables']['service_addon_assignments']['Insert'];
    const rows: Insert[] = addonIds.map(addon_id => ({
      service_id: serviceId,
      addon_id,
    }));

    const { error: insertError } = await supabase
      .from('service_addon_assignments')
      .insert(rows as never);

    if (insertError) {
      return {
        success: false,
        error: sanitizeDbError(
          insertError.message,
          'Failed to save add-on selection. Please try again.'
        ),
      };
    }

    return { success: true, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred';
    return {
      success: false,
      error: sanitizeDbError(
        message,
        'Failed to save add-on selection. Please try again.'
      ),
    };
  }
}
