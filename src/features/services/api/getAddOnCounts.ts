/**
 * Services API - Fetch add-on counts per service.
 * Server-only. Returns number of add-ons assigned to each service.
 *
 * TODO: When business_service_addons table exists, replace mock with real query.
 */

/**
 * Returns a map of service ID → add-on count.
 * Mock: returns 0 for all until DB table exists.
 */
export async function getAddOnCounts(
  _businessId: string,
  serviceIds: string[]
): Promise<Record<string, number>> {
  // TODO: Query business_service_addons and count per service_id
  const counts: Record<string, number> = {};
  for (let i = 0; i < serviceIds.length; i++) {
    counts[serviceIds[i]] = 0;
  }
  return counts;
}
