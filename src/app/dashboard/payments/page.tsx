import { ROUTES } from '@/constants/routes';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { PaymentsRevenuePage } from '@/features/payments/components/PaymentsRevenuePage';
import { getBusinessStripeConnectReady } from '@/features/payments/server/getBusinessStripeConnectReady';
import { getHasProAccessForPayments } from '@/features/payments/server/getHasProAccessForPayments';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string }>;
}) {
  const params = await searchParams;
  const connectFlag = params?.connect;
  if (connectFlag === 'return' || connectFlag === 'refresh') {
    redirect(`${ROUTES.DASHBOARD.PAYMENTS_SETTINGS}?connect=${connectFlag}`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  const stateResult = await getOnboardingState(user.id, supabase);
  if (!stateResult.success || stateResult.data?.status !== 'completed') {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const hasProAccess = await getHasProAccessForPayments(supabase, user.id);
  const businessId = stateResult.data?.businessProfile?.id;
  const stripeConnectReady =
    hasProAccess && businessId
      ? await getBusinessStripeConnectReady(supabase, businessId)
      : false;

  return (
    <PaymentsRevenuePage
      showStripeConnectNotice={hasProAccess && !stripeConnectReady}
    />
  );
}
