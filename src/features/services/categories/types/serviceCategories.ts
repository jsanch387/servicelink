/**
 * Service categories — DB types and API results.
 */

import type { Database } from '@/libs/supabase/client';

/** Database row for service_categories table. */
export type ServiceCategoryRow =
  Database['public']['Tables']['service_categories']['Row'];

export interface GetServiceCategoriesResult {
  success: boolean;
  data: ServiceCategoryRow[] | null;
  error: string | null;
}

export interface UpdateServiceCategoriesOrderResult {
  success: boolean;
  error: string | null;
}

/** Client-only filter id for uncategorized services (never persisted). */
export const SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID = '__uncategorized__';
