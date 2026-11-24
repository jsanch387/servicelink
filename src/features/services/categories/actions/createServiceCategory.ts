'use server';

import { requireShopPermission } from '@/features/team/server/requireShopPermission';
import type {
  CreateServiceCategoryPayload,
  CreateServiceCategoryResult,
} from '../api/createServiceCategory';
import { createServiceCategory as createServiceCategoryApi } from '../api/createServiceCategory';

export async function createServiceCategoryAction(
  payload: CreateServiceCategoryPayload
): Promise<CreateServiceCategoryResult> {
  const shop = await requireShopPermission('services.write');
  if (!shop.ok) {
    return { success: false, data: null, error: shop.error };
  }

  const supabase = shop.supabase;
  const businessProfile = { id: shop.businessId };

  return createServiceCategoryApi(supabase, businessProfile.id, payload);
}
