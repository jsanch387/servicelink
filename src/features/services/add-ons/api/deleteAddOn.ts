/**
 * Add-ons API - Delete an add-on.
 * Server-only; use from server actions or route handlers.
 * Removes from service_addons (CASCADE will clean service_addon_assignments).
 */

import type { Database } from '@/libs/supabase/client';
import { sanitizeDbError } from '@/utils/sanitizeDbError';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface DeleteAddOnResult {
  success: boolean;
  error: string | null;
}

/**
 * Deletes an add-on by id, scoped to the given business.
 */
export async function deleteAddOn(
  supabase: SupabaseClient<Database>,
  addonId: string,
  businessId: string
): Promise<DeleteAddOnResult> {
  try {
    const { error } = await supabase
      .from('service_addons')
      .delete()
      .eq('id', addonId)
      .eq('business_id', businessId);

    if (error) {
      return {
        success: false,
        error: sanitizeDbError(
          error.message,
          'Failed to delete add-on. Please try again.'
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
        'Failed to delete add-on. Please try again.'
      ),
    };
  }
}
