import { isProAccess } from '@/features/pricing';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Price options are a Pro-only feature for editing and saving.
 * No grandfathering: if the owner is not Pro, they cannot use price options.
 */
export async function hasPriceOptionsAccess(params: {
  supabase: SupabaseClient<Database>;
  userId: string;
}): Promise<boolean> {
  const { supabase, userId } = params;

  const profileResult = await supabase
    .from('profiles')
    .select(
      'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
    )
    .eq('user_id', userId)
    .maybeSingle();

  const profileRow = profileResult.data as {
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
    subscription_status?: string | null;
    stripe_subscription_id?: string | null;
    stripe_customer_id?: string | null;
  } | null;

  return isProAccess(
    profileRow?.subscription_tier,
    profileRow?.subscription_current_period_end,
    profileRow?.subscription_status,
    profileRow?.stripe_subscription_id,
    profileRow?.stripe_customer_id
  );
}
