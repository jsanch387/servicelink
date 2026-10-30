'use server';

/**
 * Server action: delete an add-on.
 * Resolves the current user and business, then deletes the add-on from the DB.
 */

import { requireShopPermission } from '@/features/team/server/requireShopPermission';
import { deleteAddOn as deleteAddOnApi } from '../api/deleteAddOn';
import type { DeleteAddOnResult } from '../api/deleteAddOn';

export async function deleteAddOnAction(
  addonId: string
): Promise<DeleteAddOnResult> {
  const shop = await requireShopPermission('services.write');
  if (!shop.ok) {
    return { success: false, error: shop.error };
  }

  const supabase = shop.supabase;
  const businessProfile = { id: shop.businessId };

  return deleteAddOnApi(supabase, addonId, businessProfile.id);
}
