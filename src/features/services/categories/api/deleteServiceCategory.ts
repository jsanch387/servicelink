/**
 * Service categories API — delete a category.
 * Server-only; use from server actions or route handlers.
 * Assigned services become uncategorized (category_id SET NULL via FK).
 */

import type { Database } from '@/libs/supabase/client';
import { sanitizeDbError } from '@/utils/sanitizeDbError';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface DeleteServiceCategoryResult {
  success: boolean;
  error: string | null;
}

export async function deleteServiceCategory(
  supabase: SupabaseClient<Database>,
  categoryId: string,
  businessId: string
): Promise<DeleteServiceCategoryResult> {
  try {
    const { error } = await supabase
      .from('service_categories')
      .delete()
      .eq('id', categoryId)
      .eq('business_id', businessId);

    if (error) {
      return {
        success: false,
        error: sanitizeDbError(
          error.message,
          'Failed to delete category. Please try again.'
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
        'Failed to delete category. Please try again.'
      ),
    };
  }
}
