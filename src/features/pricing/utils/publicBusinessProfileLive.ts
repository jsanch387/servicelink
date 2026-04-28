import { hasStripeBillingHistory, isProAccess } from './isProAccess';

export type PublicProfileLiveOwnerFields = {
  onboarding_status?: string | null;
  subscription_tier?: string | null;
  subscription_current_period_end?: string | null;
  subscription_status?: string | null;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
};

/**
 * Whether `/{business_slug}` and related public surfaces should resolve for visitors.
 *
 * - Requires onboarding complete.
 * - Live if effective Pro (`isProAccess`: paid trialing/active, or comped Pro).
 * - Else live only for grandfathered free: not Pro tier and no Stripe billing history.
 */
export function isPublicBusinessProfileLive(
  owner: PublicProfileLiveOwnerFields
): boolean {
  if ((owner.onboarding_status ?? '').trim() !== 'completed') {
    return false;
  }

  if (
    isProAccess(
      owner.subscription_tier,
      owner.subscription_current_period_end,
      owner.subscription_status,
      owner.stripe_subscription_id,
      owner.stripe_customer_id
    )
  ) {
    return true;
  }

  const tier = (owner.subscription_tier?.trim() || 'free').toLowerCase();
  const isFreeTier = tier !== 'pro';
  const hasHistory = hasStripeBillingHistory(
    owner.stripe_customer_id,
    owner.stripe_subscription_id,
    owner.subscription_status
  );

  return isFreeTier && !hasHistory;
}
