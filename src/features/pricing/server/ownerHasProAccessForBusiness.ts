/**
 * Server-only: resolves whether the business owner currently has Pro access.
 * Used by public booking and service APIs so price options are hidden when
 * the owner is not Pro, even if rows still exist in the database.
 */

import { isProAccess } from '@/features/pricing/utils/isProAccess';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function ownerHasProAccessForBusiness(
  supabase: SupabaseClient,
  businessId: string
): Promise<boolean> {
  const { data: biz } = await supabase
    .from('business_profiles')
    .select('profile_id')
    .eq('id', businessId)
    .maybeSingle();

  const profileId = (biz as { profile_id?: string | null } | null)?.profile_id;
  if (!profileId?.trim()) return false;

  const { data: profileRow } = await supabase
    .from('profiles')
    .select(
      'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
    )
    .eq('user_id', profileId.trim())
    .maybeSingle();

  const row = profileRow as {
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
    subscription_status?: string | null;
    stripe_subscription_id?: string | null;
    stripe_customer_id?: string | null;
  } | null;

  return isProAccess(
    row?.subscription_tier,
    row?.subscription_current_period_end,
    row?.subscription_status,
    row?.stripe_subscription_id,
    row?.stripe_customer_id
  );
}
