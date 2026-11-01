'use server';

/**
 * Server action: save add-on assignments for a service.
 * Replaces which add-ons are offered for that service.
 */

import { requireShopPermission } from '@/features/team/server/requireShopPermission';
import { saveServiceAddOnAssignments as saveServiceAddOnAssignmentsApi } from '../api/saveServiceAddOnAssignments';
import type { SaveServiceAddOnAssignmentsResult } from '../api/saveServiceAddOnAssignments';

export async function saveServiceAddOnAssignmentsAction(
  serviceId: string,
  addonIds: string[]
): Promise<SaveServiceAddOnAssignmentsResult> {
  const shop = await requireShopPermission('services.write');
  if (!shop.ok) {
    return { success: false, error: shop.error };
  }

  const supabase = shop.supabase;

  return saveServiceAddOnAssignmentsApi(supabase, serviceId, addonIds);
}
