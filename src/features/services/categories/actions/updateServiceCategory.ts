'use server';

import { requireShopPermission } from '@/features/team/server/requireShopPermission';
import type {
  UpdateServiceCategoryPayload,
  UpdateServiceCategoryResult,
} from '../api/updateServiceCategory';
import { updateServiceCategory as updateServiceCategoryApi } from '../api/updateServiceCategory';

export async function updateServiceCategoryAction(
  categoryId: string,
  payload: UpdateServiceCategoryPayload
): Promise<UpdateServiceCategoryResult> {
  const shop = await requireShopPermission('services.write');
  if (!shop.ok) {
    return { success: false, data: null, error: shop.error };
  }

  const supabase = shop.supabase;
  const businessProfile = { id: shop.businessId };

  return updateServiceCategoryApi(
    supabase,
    categoryId,
    businessProfile.id,
    payload
  );
}
