import { ROUTES } from '@/constants/routes';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { isProAccess } from '@/features/pricing';
import { QuoteRequestsDashboardPage } from '@/features/quotes/components/QuoteRequestsDashboardPage';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardQuoteRequestsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  const stateResult = await getOnboardingState(user.id);
  if (!stateResult.success || stateResult.data?.status !== 'completed') {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const { data: businessRow, error: businessError } = await supabase
    .from('business_profiles')
    .select('id, accept_quote_req')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (businessError || !businessRow) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_current_period_end')
    .eq('user_id', user.id)
    .maybeSingle();
  const tier = (profileRow as { subscription_tier?: string | null } | null)
    ?.subscription_tier;
  const periodEnd = (
    profileRow as { subscription_current_period_end?: string | null } | null
  )?.subscription_current_period_end;
  const isFreeTier = !isProAccess(tier, periodEnd);
  const acceptQuoteRequests =
    (businessRow as { accept_quote_req?: boolean | null }).accept_quote_req ===
    true;

  return (
    <QuoteRequestsDashboardPage
      isFreeTier={isFreeTier}
      acceptQuoteRequests={acceptQuoteRequests}
    />
  );
}
