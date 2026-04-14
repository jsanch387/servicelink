import { ROUTES } from '@/constants/routes';
import { CustomerManagementPage } from '@/features/customer-management';
import { hasProCheckInAccessFromTier } from '@/features/customer-management/utils/proCheckInAccess';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
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

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('user_id', user.id)
    .maybeSingle();
  const tier = (profileRow as { subscription_tier?: string | null } | null)
    ?.subscription_tier;
  const hasProCheckInAccess = hasProCheckInAccessFromTier(tier);

  return <CustomerManagementPage hasProCheckInAccess={hasProCheckInAccess} />;
}
