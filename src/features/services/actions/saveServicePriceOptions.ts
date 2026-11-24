'use server';

import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { requireShopPermission } from '@/features/team/server/requireShopPermission';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { saveServicePriceOptions as saveServicePriceOptionsApi } from '../api/saveServicePriceOptions';
import type {
  SaveServicePriceOptionsResult,
  ServicePriceOptionSaveInput,
} from '../types/services';

export async function saveServicePriceOptionsAction(
  serviceId: string,
  options: ServicePriceOptionSaveInput[]
): Promise<SaveServicePriceOptionsResult> {
  const shop = await requireShopPermission('services.write');
  if (!shop.ok) {
    return { success: false, error: shop.error };
  }

  const supabase = shop.supabase;
  const businessProfile = { id: shop.businessId };

  const canUsePriceOptions = await ownerHasProAccessForBusiness(
    createSupabaseAdminClient(),
    shop.businessId
  );

  if (!canUsePriceOptions) {
    return {
      success: false,
      error:
        'Price options are a Pro feature. Upgrade to add multiple prices per service.',
    };
  }

  return saveServicePriceOptionsApi(
    supabase,
    serviceId,
    businessProfile.id,
    options
  );
}
