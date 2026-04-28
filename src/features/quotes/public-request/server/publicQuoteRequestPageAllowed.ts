import { isProAccess } from '@/features/pricing';
import { isPublicBusinessProfileLive } from '@/features/pricing/utils/publicBusinessProfileLive';
import type { SupabaseClient } from '@supabase/supabase-js';

type MinimalBusiness = {
  accept_quote_req: boolean | null;
  profile_id: string | null;
};

export type PublicQuoteRequestAllowedForSlugResult =
  | {
      ok: true;
      businessId: string;
      profileId: string;
    }
  | { ok: false };

/**
 * Public `/[slug]/quote` and POST quote-request: business must opt in and owner must be Pro.
 */
export async function publicQuoteRequestAllowedForSlug(
  supabase: SupabaseClient,
  adminForProfiles: SupabaseClient,
  slug: string
): Promise<PublicQuoteRequestAllowedForSlugResult> {
  const { data: row, error } = await supabase
    .from('business_profiles')
    .select('id, accept_quote_req, profile_id')
    .eq('business_slug', slug)
    .maybeSingle();

  if (error || !row) {
    return { ok: false };
  }

  const biz = row as MinimalBusiness;
  if (biz.accept_quote_req !== true || !biz.profile_id) {
    return { ok: false };
  }

  const { data: ownerProfile } = await adminForProfiles
    .from('profiles')
    .select(
      'onboarding_status, subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
    )
    .eq('user_id', biz.profile_id)
    .maybeSingle();

  if (
    !isPublicBusinessProfileLive({
      onboarding_status: ownerProfile?.onboarding_status,
      subscription_tier: ownerProfile?.subscription_tier,
      subscription_current_period_end:
        ownerProfile?.subscription_current_period_end,
      subscription_status: ownerProfile?.subscription_status,
      stripe_subscription_id: ownerProfile?.stripe_subscription_id,
      stripe_customer_id: ownerProfile?.stripe_customer_id,
    })
  ) {
    return { ok: false };
  }

  const tier = ownerProfile?.subscription_tier;
  const periodEnd = ownerProfile?.subscription_current_period_end;
  const subscriptionStatus = ownerProfile?.subscription_status;
  const stripeSubscriptionId = ownerProfile?.stripe_subscription_id;
  const stripeCustomerId = ownerProfile?.stripe_customer_id;
  if (
    !isProAccess(
      tier,
      periodEnd,
      subscriptionStatus,
      stripeSubscriptionId,
      stripeCustomerId
    )
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    businessId: (row as { id: string }).id,
    profileId: biz.profile_id,
  };
}
