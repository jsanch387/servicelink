import { ROUTES } from '@/constants/routes';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { PaymentsTransactionsPage } from '@/features/payments';
import { getHasProAccessForPayments } from '@/features/payments/server/getHasProAccessForPayments';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPaymentsTransactionsPage() {
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

  const hasProAccess = await getHasProAccessForPayments(supabase, user.id);

  return <PaymentsTransactionsPage hasProAccess={hasProAccess} />;
}
