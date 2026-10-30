'use server';

import { requireShopPermission } from '@/features/team/server/requireShopPermission';
import type { DeleteServiceCategoryResult } from '../api/deleteServiceCategory';
import { deleteServiceCategory as deleteServiceCategoryApi } from '../api/deleteServiceCategory';

export async function deleteServiceCategoryAction(
  categoryId: string
): Promise<DeleteServiceCategoryResult> {
  const shop = await requireShopPermission('services.write');
  if (!shop.ok) {
    return { success: false, error: shop.error };
  }

  const supabase = shop.supabase;
  const businessProfile = { id: shop.businessId };

  return deleteServiceCategoryApi(supabase, categoryId, businessProfile.id);
}
