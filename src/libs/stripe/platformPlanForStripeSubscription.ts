import { platformPlanFromStripeSubscription } from '@/features/pricing/utils/platformPlanFromStripeSubscription';
import type { PlatformSubscriptionPlan } from '@/features/pricing/utils/hasTeamAccess';
import type Stripe from 'stripe';

function envPriceIds(
  monthlyKey: 'STRIPE_TEAM_PRICE_ID' | 'STRIPE_PRO_PRICE_ID',
  yearlyKey: 'STRIPE_TEAM_YEARLY_PRICE_ID' | 'STRIPE_PRO_YEARLY_PRICE_ID'
): string[] {
  return [process.env[monthlyKey], process.env[yearlyKey]]
    .map(value => value?.trim() ?? '')
    .filter(Boolean);
}

export function configuredPlatformPriceIds(): {
  teamPriceIds: string[];
  proPriceIds: string[];
} {
  return {
    teamPriceIds: envPriceIds(
      'STRIPE_TEAM_PRICE_ID',
      'STRIPE_TEAM_YEARLY_PRICE_ID'
    ),
    proPriceIds: envPriceIds(
      'STRIPE_PRO_PRICE_ID',
      'STRIPE_PRO_YEARLY_PRICE_ID'
    ),
  };
}

export function subscriptionPriceId(
  subscription: Stripe.Subscription
): string | null {
  const priceId = subscription.items.data[0]?.price?.id?.trim();
  return priceId || null;
}

export function platformPlanForStripeSubscription(
  subscription: Stripe.Subscription
): PlatformSubscriptionPlan {
  return platformPlanFromStripeSubscription({
    priceId: subscriptionPriceId(subscription),
    metadata: subscription.metadata,
    ...configuredPlatformPriceIds(),
  });
}

/**
 * Portal plan changes update the price and leave `platform_plan` metadata
 * behind. Stamp it when the price is one of ours so later events stay aligned.
 */
export async function stampCatalogPlatformPlanMetadata(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  plan: PlatformSubscriptionPlan
): Promise<void> {
  const priceId = subscriptionPriceId(subscription);
  const ids = configuredPlatformPriceIds();
  const recognized =
    (priceId && ids.teamPriceIds.includes(priceId)) ||
    (priceId && ids.proPriceIds.includes(priceId));
  if (!recognized || subscription.metadata?.platform_plan === plan) return;

  try {
    await stripe.subscriptions.update(subscription.id, {
      metadata: {
        ...subscription.metadata,
        platform_plan: plan,
      },
    });
  } catch (err) {
    console.warn('[pricing] could not stamp platform_plan metadata', err);
  }
}
