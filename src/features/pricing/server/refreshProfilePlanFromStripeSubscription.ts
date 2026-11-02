import { syncProfileFromSubscriptionUpdated } from '@/features/pricing/server/syncProfileFromSubscriptionUpdated';
import { resolveBillingIntervalFromStripeSubscription } from '@/features/pricing/server/resolveSubscriptionBillingInterval';
import { subscriptionCurrentPeriodEndUnix } from '@/features/pricing/server/stripeSubscriptionPeriodEnd';
import { subscriptionIsScheduledCancelWithoutRenewal } from '@/features/pricing/utils/subscriptionScheduledCancel';
import { getStripePlatform } from '@/libs/stripe';
import {
  platformPlanForStripeSubscription,
  stampCatalogPlatformPlanMetadata,
} from '@/libs/stripe/platformPlanForStripeSubscription';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

/**
 * Reads the live Stripe subscription and writes the plan onto the profile.
 * Used when the owner returns from the Team confirmation page, before the
 * webhook has necessarily landed.
 */
export async function refreshProfilePlanFromStripeSubscription(
  stripeSubscriptionId: string
): Promise<void> {
  const subId = stripeSubscriptionId.trim();
  if (!subId) return;

  try {
    const stripe = getStripePlatform();
    const subscription = await stripe.subscriptions.retrieve(subId);
    const subscriptionPlan = platformPlanForStripeSubscription(subscription);
    const admin = createSupabaseAdminClient();
    await syncProfileFromSubscriptionUpdated(admin, {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      currentPeriodEndUnix: subscriptionCurrentPeriodEndUnix(subscription),
      cancelAtPeriodEnd:
        subscriptionIsScheduledCancelWithoutRenewal(subscription),
      subscriptionBillingInterval:
        resolveBillingIntervalFromStripeSubscription(subscription),
      subscriptionPlan,
    });
    await stampCatalogPlatformPlanMetadata(
      stripe,
      subscription,
      subscriptionPlan
    );
  } catch (err) {
    console.error(
      '[pricing] refresh plan from Stripe subscription failed',
      err
    );
  }
}
