export type PlatformSubscriptionPlan = 'pro' | 'team';

/**
 * Team invites are allowed when the shop was already using Team before this
 * plan existed, or the owner is on a live Team subscription.
 * The grandfather mark stays through cancel and failed payment.
 * A Team subscription only counts while paid access is on.
 */
export function hasTeamAccess(input: {
  teamIncluded: boolean;
  subscriptionPlan: string | null | undefined;
  grantsPaidAccess: boolean;
}): boolean {
  if (input.teamIncluded) return true;
  return input.grantsPaidAccess && input.subscriptionPlan === 'team';
}

/** Stripe metadata set on new Checkout. A hosted plan change is read from the price id first. */
export function platformPlanFromStripeMetadata(
  metadata: { platform_plan?: string | null } | null | undefined
): PlatformSubscriptionPlan {
  return metadata?.platform_plan === 'team' ? 'team' : 'pro';
}
