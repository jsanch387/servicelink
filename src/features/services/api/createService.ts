/**
 * Services API - Create a new service.
 * Server-only; use from server actions or route handlers.
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  assertCanAddBusinessService,
  resolveBusinessOwnerUserId,
} from '../server/freeTierServiceLimit';
import type {
  CreateServicePayload,
  CreateServiceResult,
  ServiceRow,
} from '../types/services';

/**
 * Creates a new service for the given business.
 * Returns the created row or an error.
 */
export async function createService(
  supabase: SupabaseClient<Database>,
  businessId: string,
  payload: CreateServicePayload
): Promise<CreateServiceResult> {
  try {
    const ownerUserId = await resolveBusinessOwnerUserId(supabase, businessId);
    if (!ownerUserId) {
      return {
        success: false,
        data: null,
        error: 'Business not found.',
      };
    }
    const gate = await assertCanAddBusinessService(
      supabase,
      businessId,
      ownerUserId
    );
    if (!gate.ok) {
      return {
        success: false,
        data: null,
        error: gate.error,
      };
    }

    type TableInsert =
      Database['public']['Tables']['business_services']['Insert'];
    const insertPayload: TableInsert = {
      business_id: businessId,
      name: payload.name,
      description: payload.description.trim() || null,
      price_cents: payload.price_cents,
      duration_minutes: payload.duration_minutes,
      category_id: payload.category_id ?? null,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('business_services')
      .insert(insertPayload as never)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        data: null,
        error: error.message ?? 'Failed to create service',
      };
    }

    return {
      success: true,
      data: data as ServiceRow,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred';
    return {
      success: false,
      data: null,
      error: message,
    };
  }
}
