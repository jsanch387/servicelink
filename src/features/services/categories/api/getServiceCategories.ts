/**
 * Service categories API — fetch categories for a business.
 * Server-only; use from server components or route handlers.
 */

import { createSupabaseServerClient } from '@/libs/supabase/server';
import { sanitizeDbError } from '@/utils/sanitizeDbError';
import type {
  GetServiceCategoriesResult,
  ServiceCategoryRow,
} from '../types/serviceCategories';

/**
 * Fetches all service categories for the given business.
 * Ordered by sort_order ascending, then created_at ascending.
 */
export async function getServiceCategories(
  businessId: string
): Promise<GetServiceCategoriesResult> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return {
        success: false,
        data: null,
        error: sanitizeDbError(
          error.message,
          'Failed to load categories. Please try again.'
        ),
      };
    }

    return {
      success: true,
      data: (data ?? []) as ServiceCategoryRow[],
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
        'Failed to load categories. Please try again.'
      ),
    };
  }
}
