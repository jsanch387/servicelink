/**
 * Onboarding V2 – Step 3 server-side save.
 * Saves schedule to business_availability (same as availability page),
 * with accept_bookings set to true, then advances profiles to step 4.
 */

import { upsertAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import type { SupabaseClient } from '@supabase/supabase-js';

const PRESET_VALUES = [
  'mon_fri_9_5',
  'mon_sat_8_6',
  'weekends_only',
  'custom',
] as const;

export interface SaveStep3Params {
  profileId: string;
  businessProfileId: string;
  schedule: WeeklySchedule;
  selectedPreset: string | null;
}

export interface SaveStep3Result {
  success: boolean;
  error?: string;
}

export async function saveStep3(
  supabase: SupabaseClient,
  params: SaveStep3Params
): Promise<SaveStep3Result> {
  const { profileId, businessProfileId, schedule, selectedPreset } = params;

  if (!businessProfileId?.trim()) {
    return { success: false, error: 'Business profile is required' };
  }

  try {
    const preset =
      selectedPreset &&
      PRESET_VALUES.includes(selectedPreset as (typeof PRESET_VALUES)[number])
        ? selectedPreset
        : 'custom';

    await upsertAvailabilityForBusiness(supabase, businessProfileId, {
      accept_bookings: true,
      minimum_notice: 'none',
      weekly_schedule: schedule,
      selected_preset: preset,
    });

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        onboarding_step: 4,
        onboarding_status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profileId);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save availability',
    };
  }
}
