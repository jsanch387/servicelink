'use server';

/**
 * Server action: create a new service.
 * Resolves the current user and business, then inserts the service in the DB.
 */

import { requireShopPermission } from '@/features/team/server/requireShopPermission';
import { createService as createServiceApi } from '../api/createService';
import type {
  CreateServicePayload,
  CreateServiceResult,
} from '../types/services';

export async function createServiceAction(
  payload: CreateServicePayload
): Promise<CreateServiceResult> {
  const shop = await requireShopPermission('services.write');
  if (!shop.ok) {
    return { success: false, data: null, error: shop.error };
  }

  return createServiceApi(shop.supabase, shop.businessId, payload);
}
