/**
 * Service categories API — create a category.
 * Server-only; use from server actions or route handlers.
 */

import type { Database } from '@/libs/supabase/client';
import { sanitizeDbError } from '@/utils/sanitizeDbError';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceCategoryRow } from '../types/serviceCategories';

export interface CreateServiceCategoryPayload {
  name: string;
}

export interface CreateServiceCategoryResult {
  success: boolean;
  data: ServiceCategoryRow | null;
  error: string | null;
}

const DUPLICATE_CATEGORY_MESSAGE = 'A category with this name already exists.';

async function resolveNextSortOrder(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<number> {
  const { data } = await supabase
    .from('service_categories')
    .select('sort_order')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = data as { sort_order?: number } | null;
  if (row?.sort_order == null) return 0;
  return row.sort_order + 10;
}

export async function createServiceCategory(
  supabase: SupabaseClient<Database>,
  businessId: string,
  payload: CreateServiceCategoryPayload
): Promise<CreateServiceCategoryResult> {
  try {
    const sortOrder = await resolveNextSortOrder(supabase, businessId);

    type TableInsert =
      Database['public']['Tables']['service_categories']['Insert'];
    const insertPayload: TableInsert = {
      business_id: businessId,
      name: payload.name.trim(),
      sort_order: sortOrder,
    };

    const { data, error } = await supabase
      .from('service_categories')
      .insert(insertPayload as never)
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
      return {
        success: false,
        data: null,
        error: sanitizeDbError(
          error.message,
          'Failed to create category. Please try again.'
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
        'Failed to create category. Please try again.'
      ),
    };
  }
}
