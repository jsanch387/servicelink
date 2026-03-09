/**
 * Services API - Fetch add-on counts per service.
 * Server-only. Returns number of add-ons assigned to each service (from business_service_addons).
 */

import { createSupabaseServerClient } from '@/libs/supabase/server';

/**
 * Returns a map of service ID → add-on count from service_addon_assignments.
 */
export async function getAddOnCounts(
  _businessId: string,
  serviceIds: string[]
): Promise<Record<string, number>> {
  if (serviceIds.length === 0) return {};

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('service_addon_assignments')
      .select('service_id')
      .in('service_id', serviceIds);

    if (error) return Object.fromEntries(serviceIds.map(id => [id, 0]));

    const counts: Record<string, number> = Object.fromEntries(
      serviceIds.map(id => [id, 0])
    );
    const rows = (data ?? []) as { service_id: string }[];
    for (const row of rows) {
      counts[row.service_id] = (counts[row.service_id] ?? 0) + 1;
    }
    return counts;
  } catch {
    return Object.fromEntries(serviceIds.map(id => [id, 0]));
  }
}
