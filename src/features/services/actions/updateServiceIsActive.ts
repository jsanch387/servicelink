'use server';

/**
 * Server action: update a service's is_active (visibility) flag.
 */

import { requireShopPermission } from '@/features/team/server/requireShopPermission';
import { updateServiceIsActive as updateServiceIsActiveApi } from '../api/updateServiceIsActive';
import type { UpdateServiceIsActiveResult } from '../types/services';

export async function updateServiceIsActiveAction(
  serviceId: string,
  isActive: boolean
): Promise<UpdateServiceIsActiveResult> {
  const shop = await requireShopPermission('services.write');
  if (!shop.ok) {
    return { success: false, error: shop.error };
  }

  const supabase = shop.supabase;
  const businessProfile = { id: shop.businessId };

  return updateServiceIsActiveApi(
    supabase,
    serviceId,
    businessProfile.id,
    isActive
  );
}
