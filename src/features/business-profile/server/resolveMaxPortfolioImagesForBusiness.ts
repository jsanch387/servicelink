import {
  maxPortfolioImagesForSubscription,
  type OwnerSubscriptionFieldsForPortfolio,
} from '@/features/pricing/utils/maxPortfolioImagesForSubscription';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Max portfolio images this business may store / show (4 Free, 8 Pro).
 * Uses `business_profiles.profile_id` → `profiles` subscription fields.
 */
export async function resolveMaxPortfolioImagesForBusiness(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<number> {
  const { data: bp } = await supabase
    .from('business_profiles')
    .select('profile_id')
    .eq('id', businessId)
    .maybeSingle();

  const profileId = (bp as { profile_id?: string | null } | null)?.profile_id;
  if (!profileId) {
    return maxPortfolioImagesForSubscription(null);
  }

  const { data: owner } = await supabase
    .from('profiles')
    .select(
      'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
    )
    .eq('user_id', profileId)
    .maybeSingle();

  return maxPortfolioImagesForSubscription(
    owner as OwnerSubscriptionFieldsForPortfolio | null
  );
}
