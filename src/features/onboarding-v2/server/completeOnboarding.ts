/**
 * Onboarding V2 – Mark onboarding complete.
 * Sets profiles.onboarding_status = 'completed' and onboarding_step = 5.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface CompleteOnboardingResult {
  success: boolean;
  error?: string;
}

export async function completeOnboardingV2(
  supabase: SupabaseClient,
  profileId: string
): Promise<CompleteOnboardingResult> {
  if (!profileId?.trim()) {
    return { success: false, error: 'Profile ID is required' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_status: 'completed',
      onboarding_step: 5,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', profileId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
