/**
 * Services API - Fetch services for a business.
 * Server-only; use from server components or route handlers.
 */

import { createSupabaseServerClient } from '@/libs/supabase/server';
import type { GetServicesResult, ServiceRow } from '../types/services';

/**
 * Fetches all services for the given business (any is_active value).
 * Raw fetch only — apply sortServicesForDisplay(services, categories) for UI.
 */
export async function getServices(
  businessId: string
): Promise<GetServicesResult> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('business_services')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true });

    if (error) {
      return {
        success: false,
        data: null,
        error: error.message ?? 'Failed to load services',
      };
    }

    return {
      success: true,
      data: (data ?? []) as ServiceRow[],
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
