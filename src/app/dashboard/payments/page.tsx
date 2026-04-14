import { ROUTES } from '@/constants/routes';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { PaymentsPage } from '@/features/payments';
import { logConnect } from '@/features/payments/server/connectOnboardingLog';
import { getHasProAccessForPayments } from '@/features/payments/server/getHasProAccessForPayments';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { syncConnectPaymentAccountForBusiness } from '@/features/payments/server/syncConnectPaymentAccount';
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

  const businessId = stateResult.data?.businessProfile?.id;
  if (!businessId) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const hasProAccess = await getHasProAccessForPayments(supabase, user.id);

  const shouldHandleConnectQuery =
    hasProAccess && (connectFlag === 'return' || connectFlag === 'refresh');

  if (shouldHandleConnectQuery) {
    logConnect('page.connect_callback', {
      userId: user.id,
      businessId,
      connect: connectFlag,
      hasStripeSecret: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    });
    if (process.env.STRIPE_SECRET_KEY?.trim()) {
      const syncResult = await syncConnectPaymentAccountForBusiness(
        supabase,
        businessId
      );
      if (!syncResult.ok) {
        logConnect('page.sync_failed', {
          businessId,
          error: syncResult.error,
        });
        console.error(
          'DashboardPaymentsPage: Connect sync failed',
          syncResult.error
        );
      } else if (syncResult.skipped) {
        logConnect('page.sync_skipped', {
          businessId,
          reason: syncResult.reason,
        });
      } else {
        logConnect('page.sync_ok', { businessId });
      }
    } else {
      logConnect('page.sync_skipped', {
        businessId,
        reason: 'missing_stripe_secret',
      });
    }
    redirect(ROUTES.DASHBOARD.PAYMENTS);
  }

  const { data: paymentAccount } = await paymentAccountsOf(supabase)
    .select('onboarding_status, charges_enabled, stripe_account_id')
    .eq('business_id', businessId)
    .maybeSingle();

  const paymentsSetupComplete =
    paymentAccount?.onboarding_status === 'complete' &&
    paymentAccount?.charges_enabled === true;

  const stripeConnectResume =
    hasProAccess &&
    !paymentsSetupComplete &&
    !!paymentAccount?.stripe_account_id &&
    (paymentAccount.onboarding_status === 'in_progress' ||
      paymentAccount.onboarding_status === 'restricted');

  return (
    <PaymentsPage
      hasProAccess={hasProAccess}
      paymentsSetupComplete={paymentsSetupComplete}
      stripeConnectResume={stripeConnectResume}
    />
  );
}
