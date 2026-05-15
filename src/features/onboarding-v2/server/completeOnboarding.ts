/**
 * Onboarding V2 – Mark onboarding complete.
 * Sets profiles.onboarding_status = 'completed' and onboarding_step = 5.
 */

import { sendWelcomeLiveEmail } from '@/features/email';
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

/**
 * Completes onboarding and sends **“Your business is officially LIVE!”** once when
 * activation transitions the profile from not-completed → completed (Step 5
 * “Activate my link”, or the Stripe onboarding-trial bridge). Idempotent on repeat
 * completes: no duplicate email.
 */
export async function completeOnboardingV2WithWelcomeLiveEmail(
  supabase: SupabaseClient,
  profileId: string,
  userEmail: string | null | undefined
): Promise<CompleteOnboardingResult> {
  if (!profileId?.trim()) {
    return { success: false, error: 'Profile ID is required' };
  }

  const id = profileId.trim();

  const { data: profileBeforeComplete } = await supabase
    .from('profiles')
    .select('onboarding_status')
    .eq('user_id', id)
    .single();

  const wasAlreadyCompleted =
    profileBeforeComplete?.onboarding_status === 'completed';

  const completeResult = await completeOnboardingV2(supabase, id);
  if (!completeResult.success) {
    return completeResult;
  }

  if (!wasAlreadyCompleted && userEmail?.trim()) {
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('business_slug')
      .eq('profile_id', id)
      .single();

    const businessSlug = businessProfile?.business_slug?.trim();

    if (businessSlug) {
      const emailResult = await sendWelcomeLiveEmail(userEmail.trim(), {
        businessSlug,
      });
      if (!emailResult.sent) {
        console.error(
          '[completeOnboardingV2WithWelcomeLiveEmail] welcome live email failed',
          emailResult.error
        );
      }
    }
  }

  return { success: true };
}
