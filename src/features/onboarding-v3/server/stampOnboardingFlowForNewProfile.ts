import type { SupabaseClient } from '@supabase/supabase-js';

import { onboardingFlowForEmail } from '../config/onboardingV3Allowlist';

/**
 * People who have not started a setup get the 2-step setup.
 * The auth trigger can insert the profile first, without these columns.
 */
export async function stampOnboardingFlowForNewProfile(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined
): Promise<'v2' | 'v3'> {
  const flow = onboardingFlowForEmail(email);

  await supabase
    .from('profiles')
    .update({ onboarding_flow: flow })
    .eq('user_id', userId)
    .eq('onboarding_status', 'not_started')
    .is('onboarding_flow', null);

  await supabase
    .from('profiles')
    .update({ signup_platform: 'web' })
    .eq('user_id', userId)
    .eq('onboarding_status', 'not_started')
    .is('signup_platform', null);

  return flow;
}
