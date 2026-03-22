/**
 * Availability feature – server-side data access.
 * Used by API routes only. Do not import from client components.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { BusinessAvailabilityRow } from '../types/availability';
import type { TimeOffBlockStored } from '../types/blockTime';

const TABLE = 'business_availability';

/**
 * Fetches the availability row for a business, if it exists.
 * Returns null when the business has not set up availability yet.
 */
export async function getAvailabilityForBusiness(
  supabase: SupabaseClient,
  businessId: string
): Promise<BusinessAvailabilityRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return data as BusinessAvailabilityRow;
}

/** Payload to save (snake_case for DB). */
export interface SaveAvailabilityPayload {
  accept_bookings: boolean;
  minimum_notice: string;
  weekly_schedule: BusinessAvailabilityRow['weekly_schedule'];
  selected_preset: string;
  /**
   * When set, persisted on upsert. When omitted (e.g. onboarding Step 3), the column
   * is left to DB default on insert or unchanged on update.
   */
  time_off_blocks?: TimeOffBlockStored[];
}

/**
 * Inserts or updates the availability row for a business.
 * Uses upsert on business_id so one row per business.
 */
export async function upsertAvailabilityForBusiness(
  supabase: SupabaseClient,
  businessId: string,
  payload: SaveAvailabilityPayload
): Promise<BusinessAvailabilityRow> {
  const row: Record<string, unknown> = {
    business_id: businessId,
    accept_bookings: payload.accept_bookings,
    minimum_notice: payload.minimum_notice,
    weekly_schedule: payload.weekly_schedule,
    selected_preset: payload.selected_preset,
  };
  if (payload.time_off_blocks !== undefined) {
    row.time_off_blocks = payload.time_off_blocks;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .upsert(row, { onConflict: 'business_id' })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as BusinessAvailabilityRow;
}
