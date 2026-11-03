import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * People who have not started a flow belong on the 2-step setup.
 * The auth trigger can insert the profile first, without these columns.
 */
export async function stampV3ForNewProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase
    .from('profiles')
    .update({ onboarding_flow: 'v3' })
    .eq('user_id', userId)
    .eq('onboarding_status', 'not_started')
    .is('onboarding_flow', null);

  await supabase
    .from('profiles')
    .update({ signup_platform: 'web' })
    .eq('user_id', userId)
    .eq('onboarding_status', 'not_started')
    .is('signup_platform', null);
}
