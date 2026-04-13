import { isProAccess } from '@/features/pricing';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getHasProAccessForPayments(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_current_period_end')
    .eq('user_id', userId)
    .maybeSingle();

  const row = profileRow as {
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
  } | null;

  return isProAccess(row?.subscription_tier, row?.subscription_current_period_end);
}
