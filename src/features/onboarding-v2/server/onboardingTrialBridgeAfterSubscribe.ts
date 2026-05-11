/**
 * Shared follow-up after a Pro trial subscription is created for onboarding
 * (silent API or Stripe Checkout webhook). Marks onboarding complete and sends
 * the welcome email once.
 */

import { sendWelcomeLiveEmail } from '@/features/email';
import type { SupabaseClient } from '@supabase/supabase-js';

import { completeOnboardingV2 } from './completeOnboarding';

export async function runOnboardingTrialBridgeAfterSubscribe(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined
): Promise<{ success: boolean; error?: string }> {
  if (!userId?.trim()) {
    return { success: false, error: 'userId is required' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileBeforeComplete } = await (supabase as any)
    .from('profiles')
    .select('onboarding_status')
    .eq('user_id', userId.trim())
    .single();
  const wasAlreadyCompleted =
    profileBeforeComplete?.onboarding_status === 'completed';

  const completeResult = await completeOnboardingV2(supabase, userId.trim());
  if (!completeResult.success) {
    return { success: false, error: completeResult.error };
  }

  if (!wasAlreadyCompleted && userEmail?.trim()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: businessProfile } = await (supabase as any)
      .from('business_profiles')
      .select('business_slug')
      .eq('profile_id', userId.trim())
      .single();
    const businessSlug = businessProfile?.business_slug?.trim();

    if (businessSlug) {
      const emailResult = await sendWelcomeLiveEmail(userEmail.trim(), {
        businessSlug,
      });
      if (!emailResult.sent) {
        console.error(
          '[onboardingTrialBridgeAfterSubscribe] welcome live email failed',
          emailResult.error
        );
      }
    }
  }

  return { success: true };
}
