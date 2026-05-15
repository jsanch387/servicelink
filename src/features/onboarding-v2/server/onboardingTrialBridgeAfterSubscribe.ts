/**
 * Shared follow-up after a Pro trial subscription is created for onboarding
 * (silent API or Stripe Checkout webhook). Marks onboarding complete and sends
 * the welcome email once.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { completeOnboardingV2WithWelcomeLiveEmail } from './completeOnboarding';

export async function runOnboardingTrialBridgeAfterSubscribe(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined
): Promise<{ success: boolean; error?: string }> {
  if (!userId?.trim()) {
    return { success: false, error: 'userId is required' };
  }

  const result = await completeOnboardingV2WithWelcomeLiveEmail(
    supabase,
    userId.trim(),
    userEmail
  );
  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}
