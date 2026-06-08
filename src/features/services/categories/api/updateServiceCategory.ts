/**
 * Service categories API — update a category.
 * Server-only; use from server actions or route handlers.
 */

import type { Database } from '@/libs/supabase/client';
import { sanitizeDbError } from '@/utils/sanitizeDbError';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceCategoryRow } from '../types/serviceCategories';

export interface UpdateServiceCategoryPayload {
  name: string;
}

export interface UpdateServiceCategoryResult {
  success: boolean;
  data: ServiceCategoryRow | null;
  error: string | null;
}

const DUPLICATE_CATEGORY_MESSAGE = 'A category with this name already exists.';

export async function updateServiceCategory(
  supabase: SupabaseClient<Database>,
  categoryId: string,
  businessId: string,
  payload: UpdateServiceCategoryPayload
): Promise<UpdateServiceCategoryResult> {
  try {
    type TableUpdate =
      Database['public']['Tables']['service_categories']['Update'];
    const updatePayload: TableUpdate = {
      name: payload.name.trim(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('service_categories')
      .update(updatePayload as never)
      .eq('id', categoryId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          data: null,
          error: DUPLICATE_CATEGORY_MESSAGE,
        };
      }
      if (error.code === 'PGRST116') {
        return {
          success: false,
          data: null,
          error:
            'Category not found or you don’t have permission to update it.',
        };
      }
      return {
        success: false,
        data: null,
        error: sanitizeDbError(
          error.message,
          'Failed to update category. Please try again.'
        ),
      };
    }

    return {
      success: true,
      data: data as ServiceCategoryRow,
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
        'Failed to update category. Please try again.'
      ),
    };
  }
}
