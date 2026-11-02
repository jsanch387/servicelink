import {
  platformPlanFromStripeMetadata,
  type PlatformSubscriptionPlan,
} from './hasTeamAccess';

/**
 * Live plan from the subscription price. Catalog prices win over metadata so a
 * Stripe-hosted plan change still lands on Team when metadata was left on Pro.
 * Unknown prices (legacy $10 and similar) stay on metadata.
 */
export function platformPlanFromStripeSubscription(input: {
  priceId: string | null | undefined;
  metadata: { platform_plan?: string | null } | null | undefined;
  teamPriceIds: readonly string[];
  proPriceIds: readonly string[];
}): PlatformSubscriptionPlan {
  const priceId = input.priceId?.trim() ?? '';
  if (priceId && input.teamPriceIds.includes(priceId)) return 'team';
  if (priceId && input.proPriceIds.includes(priceId)) return 'pro';
  return platformPlanFromStripeMetadata(input.metadata);
}
