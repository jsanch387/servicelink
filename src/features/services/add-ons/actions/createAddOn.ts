'use server';

/**
 * Server action: create a new add-on.
 * Resolves the current user and business, then inserts the add-on in the DB.
 */

import { requireShopPermission } from '@/features/team/server/requireShopPermission';
import type { CreateAddOnPayload, CreateAddOnResult } from '../api/createAddOn';
import { createAddOn as createAddOnApi } from '../api/createAddOn';

export async function createAddOnAction(
  payload: CreateAddOnPayload
): Promise<CreateAddOnResult> {
  const shop = await requireShopPermission('services.write');
  if (!shop.ok) {
    return { success: false, data: null, error: shop.error };
  }

  const supabase = shop.supabase;
  const businessProfile = { id: shop.businessId };

  return createAddOnApi(supabase, businessProfile.id, payload);
}
