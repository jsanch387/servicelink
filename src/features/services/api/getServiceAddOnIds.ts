/**
 * Services API - Get add-on IDs assigned to a service.
 * Server-only; use from server components or route handlers.
 */

import { createSupabaseServerClient } from '@/libs/supabase/server';

export interface GetServiceAddOnIdsResult {
  success: boolean;
  data: string[] | null;
  error: string | null;
}

/**
 * Returns addon_id[] for the given service from service_addon_assignments.
 */
export async function getServiceAddOnIds(
  serviceId: string
): Promise<GetServiceAddOnIdsResult> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('service_addon_assignments')
      .select('addon_id')
      .eq('service_id', serviceId);

    if (error) {
      return {
        success: false,
        data: null,
        error: error.message ?? 'Failed to load add-on assignments',
      };
    }

    const ids = (data ?? []).map((row: { addon_id: string }) => row.addon_id);

    return {
      success: true,
      data: ids,
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
