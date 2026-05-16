/**
 * Onboarding V2 – Mark onboarding complete.
 * Sets profiles.onboarding_status = 'completed' and onboarding_step = 5.
 */

import { sendWelcomeLiveEmail } from '@/features/email';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { WelcomeEmailOutcome } from './welcomeLiveEmailOutcome';

export interface CompleteOnboardingResult {
  success: boolean;
  error?: string;
  /** Present when `success` — explains whether welcome-live email ran. */
  welcomeEmail?: WelcomeEmailOutcome;
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
export type CompleteOnboardingWithWelcomeOptions = {
  /**
   * When true, still attempt the welcome-live email if onboarding was already
   * `completed` before this call (e.g. mobile updated Supabase locally first).
   * Call once on step 5 to avoid duplicate sends.
   */
  sendWelcomeEvenIfAlreadyCompleted?: boolean;
};

export async function completeOnboardingV2WithWelcomeLiveEmail(
  supabase: SupabaseClient,
  profileId: string,
  userEmail: string | null | undefined,
  options?: CompleteOnboardingWithWelcomeOptions
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

  const emailTrimmed = userEmail?.trim() ?? '';
  const allowWelcomeDespiteCompleted =
    options?.sendWelcomeEvenIfAlreadyCompleted === true;

  if (wasAlreadyCompleted && !allowWelcomeDespiteCompleted) {
    return {
      success: true,
      welcomeEmail: { attempted: false, reason: 'already_completed_no_flag' },
    };
  }

  if (!emailTrimmed) {
    return {
      success: true,
      welcomeEmail: { attempted: false, reason: 'no_owner_email' },
    };
  }

  const { data: businessProfile, error: businessError } = await supabase
    .from('business_profiles')
    .select('business_slug')
    .eq('profile_id', id)
    .maybeSingle();

  if (businessError || !businessProfile) {
    return {
      success: true,
      welcomeEmail: { attempted: false, reason: 'no_business_profile' },
    };
  }

  const businessSlug = businessProfile.business_slug?.trim();
  if (!businessSlug) {
    return {
      success: true,
      welcomeEmail: { attempted: false, reason: 'no_business_slug' },
    };
  }

  const emailResult = await sendWelcomeLiveEmail(emailTrimmed, {
    businessSlug,
  });

  if (!emailResult.sent) {
    return {
      success: true,
      welcomeEmail: {
        attempted: true,
        sent: false,
        error: emailResult.error ?? 'unknown',
      },
    };
  }

  return {
    success: true,
    welcomeEmail: { attempted: true, sent: true },
  };
}
