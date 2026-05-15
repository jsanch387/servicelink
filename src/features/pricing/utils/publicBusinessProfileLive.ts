/**
 * Owner fields needed to decide if a public slug should resolve.
 * (Kept minimal; subscription fields remain for callers that still pass them.)
 */
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
 * **Rule:** onboarding must be **completed**. Subscription state does not hide the
 * public profile (free, churned, or lapsed Stripe still get a page); booking and
 * Pro-only features are gated elsewhere.
 */
export function isPublicBusinessProfileLive(
  owner: PublicProfileLiveOwnerFields
): boolean {
  return (owner.onboarding_status ?? '').trim() === 'completed';
}
