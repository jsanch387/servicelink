'use server';

/**
 * Server action: update an add-on.
 * Resolves the current user and business, then updates the add-on in the DB.
 */

import { requireShopPermission } from '@/features/team/server/requireShopPermission';
import type { UpdateAddOnPayload, UpdateAddOnResult } from '../api/updateAddOn';
import { updateAddOn as updateAddOnApi } from '../api/updateAddOn';

export async function updateAddOnAction(
  addonId: string,
  payload: UpdateAddOnPayload
): Promise<UpdateAddOnResult> {
  const shop = await requireShopPermission('services.write');
  if (!shop.ok) {
    return { success: false, data: null, error: shop.error };
  }

  const supabase = shop.supabase;
  const businessProfile = { id: shop.businessId };

  return updateAddOnApi(supabase, addonId, businessProfile.id, payload);
}
