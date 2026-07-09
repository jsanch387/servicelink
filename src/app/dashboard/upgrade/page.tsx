import {
  isProAccess,
  needsPaidProResubscribeForDashboard,
  UpgradeContent,
} from '@/features/pricing';
import { getSubscriptionPriceDisplay } from '@/features/pricing/server/getSubscriptionMonthlyPriceDisplay';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Upgrade page — compares Free vs Pro; checkout for Free users, manage billing for Pro.
 */
export default async function DashboardUpgradePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: profileRow } = await supabase
    .from('profiles')
    .select(
      'onboarding_status, subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id, subscription_billing_interval'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  const row = profileRow as {
    onboarding_status?: string | null;
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
    subscription_status?: string | null;
    stripe_subscription_id?: string | null;
    stripe_customer_id?: string | null;
    subscription_billing_interval?: string | null;
  } | null;

  const isProSubscriber = isProAccess(
    row?.subscription_tier,
    row?.subscription_current_period_end,
    row?.subscription_status,
    row?.stripe_subscription_id,
    row?.stripe_customer_id
  );
  const onboardingComplete = row?.onboarding_status === 'completed';
  const needsResubscribeGate = needsPaidProResubscribeForDashboard(
    row?.subscription_tier,
    row?.subscription_status,
    row?.stripe_subscription_id,
    row?.stripe_customer_id
  );
  const isBillingLocked =
    onboardingComplete && needsResubscribeGate && !isProSubscriber;

  const storedBillingInterval =
    row?.subscription_billing_interval === 'year'
      ? 'year'
      : row?.subscription_billing_interval === 'month'
        ? 'month'
        : null;
  let subscriberPlanPrice: string | null = null;
  let subscriberBillingInterval: 'month' | 'year' | null =
    storedBillingInterval;
  const subscriptionId = row?.stripe_subscription_id?.trim();
  if (isProSubscriber && subscriptionId) {
    const priceDisplay = await getSubscriptionPriceDisplay(subscriptionId);
    subscriberPlanPrice = priceDisplay?.amount ?? null;
    subscriberBillingInterval =
      storedBillingInterval ?? priceDisplay?.interval ?? null;
  }

  // Free users (no resubscribe gate) must be able to open this page to start checkout.
  // Middleware sends lapsed **pro** rows without Pro access here; downgraded **free** users are not billing-locked.

  return (
    <UpgradeContent
      isProSubscriber={isProSubscriber}
      isBillingLocked={isBillingLocked}
      subscriberPlanPrice={subscriberPlanPrice}
      subscriberBillingInterval={subscriberBillingInterval}
    />
  );
}
