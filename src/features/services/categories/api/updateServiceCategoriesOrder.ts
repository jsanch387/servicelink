/**
 * Service categories API — save category section sort order.
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sortOrderForBucketIndex } from '../utils/sortServicesForDisplay';
import type { UpdateServiceCategoriesOrderResult } from '../types/serviceCategories';

/**
 * Updates sort_order for each category to match the given order.
 * orderedIds[0] gets sort_order 0, orderedIds[1] gets 10, etc.
 */
export async function updateServiceCategoriesOrder(
  supabase: SupabaseClient<Database>,
  businessId: string,
  orderedIds: string[]
): Promise<UpdateServiceCategoriesOrderResult> {
  try {
    type TableUpdate =
      Database['public']['Tables']['service_categories']['Update'];

    for (let i = 0; i < orderedIds.length; i++) {
      const payload: TableUpdate = {
        sort_order: sortOrderForBucketIndex(i),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('service_categories')
        .update(payload as never)
        .eq('id', orderedIds[i])
        .eq('business_id', businessId);

      if (error) {
        return {
          success: false,
          error:
            error.message ?? 'Failed to save category order. Please try again.',
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
