'use server';

/**
 * Server action: save the current services sort order.
 */

import { requireShopPermission } from '@/features/team/server/requireShopPermission';
import { updateServicesOrder as updateServicesOrderApi } from '../api/updateServicesOrder';
import type { UpdateServicesOrderResult } from '../types/services';

export async function saveServicesOrderAction(
  orderedServiceIds: string[]
): Promise<UpdateServicesOrderResult> {
  const shop = await requireShopPermission('services.write');
  if (!shop.ok) {
    return { success: false, error: shop.error };
  }

  const supabase = shop.supabase;
  const businessProfile = { id: shop.businessId };

  return updateServicesOrderApi(
    supabase,
    businessProfile.id,
    orderedServiceIds
  );
}
