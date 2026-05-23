import { ROUTES } from '@/constants/routes';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { PaymentsPage } from '@/features/payments';
import { logConnect } from '@/features/payments/server/connectOnboardingLog';
import { getHasProAccessForPayments } from '@/features/payments/server/getHasProAccessForPayments';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import { syncConnectPaymentAccountForBusiness } from '@/features/payments/server/syncConnectPaymentAccount';
import type { PaymentSettingsDashboardInitial } from '@/features/payments/types/paymentSettingsDashboard';
import { paymentSettingsRowToDashboardInitial } from '@/features/payments/utils/paymentSettingsMaps';
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

  const stateResult = await getOnboardingState(user.id, supabase);
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

  const stripeConnectReady =
    paymentAccount?.onboarding_status === 'complete' &&
    paymentAccount?.charges_enabled === true;

  const { data: paymentSettingsRow } = await paymentSettingsOf(supabase)
    .select(
      'payments_enabled, checkout_mode, deposits_enabled, deposit_type, deposit_value, currency'
    )
    .eq('business_id', businessId)
    .maybeSingle();

  const servicelinkPaymentsEnabled =
    paymentSettingsRow?.payments_enabled === true;

  const hasPaymentSettingsRow = Boolean(paymentSettingsRow);

  let paymentSettingsForDashboard: PaymentSettingsDashboardInitial | null =
    null;
  if (
    stripeConnectReady &&
    (servicelinkPaymentsEnabled || hasPaymentSettingsRow)
  ) {
    paymentSettingsForDashboard = paymentSettingsRow
      ? paymentSettingsRowToDashboardInitial(paymentSettingsRow)
      : {
          checkoutMode: null,
          depositsEnabled: false,
          depositType: 'percent',
          depositValue: 0,
          currency: 'usd',
        };
  }

  const stripeConnectResume =
    hasProAccess &&
    !stripeConnectReady &&
    !!paymentAccount?.stripe_account_id?.trim();

  const stripeConnectRestricted =
    paymentAccount?.onboarding_status === 'restricted';

  const priorPaymentsSetup =
    hasPaymentSettingsRow || !!paymentAccount?.stripe_account_id?.trim();

  return (
    <PaymentsPage
      hasProAccess={hasProAccess}
      stripeConnectReady={stripeConnectReady}
      servicelinkPaymentsEnabled={servicelinkPaymentsEnabled}
      stripeConnectResume={stripeConnectResume}
      stripeConnectRestricted={stripeConnectRestricted}
      priorPaymentsSetup={priorPaymentsSetup}
      paymentSettings={paymentSettingsForDashboard}
      stripeExpressAccountId={paymentAccount?.stripe_account_id?.trim() ?? null}
    />
  );
}
