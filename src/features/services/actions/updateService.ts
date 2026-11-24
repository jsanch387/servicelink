'use server';

/**
 * Server action: update a service.
 * Resolves the current user and business, then updates the service in the DB.
 */

import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { requireShopPermission } from '@/features/team/server/requireShopPermission';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { updateService as updateServiceApi } from '../api/updateService';
import type {
  UpdateServicePayload,
  UpdateServiceResult,
} from '../types/services';

export async function updateServiceAction(
  serviceId: string,
  payload: UpdateServicePayload
): Promise<UpdateServiceResult> {
  const shop = await requireShopPermission('services.write');
  if (!shop.ok) {
    return { success: false, data: null, error: shop.error };
  }

  const canUsePriceOptions = await ownerHasProAccessForBusiness(
    createSupabaseAdminClient(),
    shop.businessId
  );

  const normalizedPayload: UpdateServicePayload = {
    ...payload,
    ...(payload.price_options_enabled != null && !canUsePriceOptions
      ? { price_options_enabled: false }
      : {}),
  };

  return updateServiceApi(
    shop.supabase,
    serviceId,
    shop.businessId,
    normalizedPayload
  );
}
