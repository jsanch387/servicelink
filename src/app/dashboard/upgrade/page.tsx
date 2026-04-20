import { isProAccess, UpgradeContent } from '@/features/pricing';
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
      'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  const row = profileRow as {
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
    subscription_status?: string | null;
    stripe_subscription_id?: string | null;
    stripe_customer_id?: string | null;
  } | null;

  const isProSubscriber = isProAccess(
    row?.subscription_tier,
    row?.subscription_current_period_end,
    row?.subscription_status,
    row?.stripe_subscription_id,
    row?.stripe_customer_id
  );

  return <UpgradeContent isProSubscriber={isProSubscriber} />;
}
