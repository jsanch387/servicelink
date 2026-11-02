import { hasTeamAccess } from '@/features/pricing/utils/hasTeamAccess';
import { isProAccess } from '@/features/pricing/utils/isProAccess';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type BusinessTeamAccess = {
  hasAccess: boolean;
  teamIncluded: boolean;
};

/**
 * Team is allowed for a grandfathered shop, or for an owner on a live Team
 * subscription. Missing rows fail closed.
 */
export async function loadBusinessTeamAccess(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<BusinessTeamAccess> {
  const { data: business, error } = await supabase
    .from('business_profiles')
    .select('team_included, profile_id')
    .eq('id', businessId)
    .maybeSingle();

  const shop = business as {
    team_included?: boolean | null;
    profile_id?: string | null;
  } | null;

  if (error || !shop) {
    return { hasAccess: false, teamIncluded: false };
  }

  if (shop.team_included) {
    return { hasAccess: true, teamIncluded: true };
  }

  const ownerId = shop.profile_id?.trim() ?? '';
  if (!ownerId) {
    return { hasAccess: false, teamIncluded: false };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id, subscription_plan'
    )
    .eq('user_id', ownerId)
    .maybeSingle();

  const owner = profile as {
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
    subscription_status?: string | null;
    stripe_subscription_id?: string | null;
    stripe_customer_id?: string | null;
    subscription_plan?: string | null;
  } | null;

  if (profileError || !owner) {
    return { hasAccess: false, teamIncluded: false };
  }

  return {
    teamIncluded: false,
    hasAccess: hasTeamAccess({
      teamIncluded: false,
      subscriptionPlan: owner.subscription_plan,
      grantsPaidAccess: isProAccess(
        owner.subscription_tier,
        owner.subscription_current_period_end,
        owner.subscription_status,
        owner.stripe_subscription_id,
        owner.stripe_customer_id
      ),
    }),
  };
}
