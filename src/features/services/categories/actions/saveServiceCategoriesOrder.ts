'use server';

import { requireShopPermission } from '@/features/team/server/requireShopPermission';
import { updateServiceCategoriesOrder as updateServiceCategoriesOrderApi } from '../api/updateServiceCategoriesOrder';
import type { UpdateServiceCategoriesOrderResult } from '../types/serviceCategories';

export async function saveServiceCategoriesOrderAction(
  orderedCategoryIds: string[]
): Promise<UpdateServiceCategoriesOrderResult> {
  const shop = await requireShopPermission('services.write');
  if (!shop.ok) {
    return { success: false, error: shop.error };
  }

  const supabase = shop.supabase;
  const businessProfile = { id: shop.businessId };

  return updateServiceCategoriesOrderApi(
    supabase,
    businessProfile.id,
    orderedCategoryIds
  );
}
