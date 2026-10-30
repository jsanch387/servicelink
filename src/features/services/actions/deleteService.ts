'use server';

/**
 * Server action: delete a service.
 * Resolves the current user and business, then deletes the service in the DB.
 */

import { requireShopPermission } from '@/features/team/server/requireShopPermission';
import { deleteService as deleteServiceApi } from '../api/deleteService';
import type { DeleteServiceResult } from '../types/services';

export async function deleteServiceAction(
  serviceId: string
): Promise<DeleteServiceResult> {
  const shop = await requireShopPermission('services.write');
  if (!shop.ok) {
    return { success: false, error: shop.error };
  }

  const supabase = shop.supabase;
  const businessProfile = { id: shop.businessId };

  return deleteServiceApi(supabase, serviceId, businessProfile.id);
}
