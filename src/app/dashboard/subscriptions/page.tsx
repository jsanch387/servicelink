import { ROUTES } from '@/constants/routes';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { logConnect } from '@/features/payments/server/connectOnboardingLog';
import { syncConnectPaymentAccountForBusiness } from '@/features/payments/server/syncConnectPaymentAccount';
import { OwnerSubscriptionsPage } from '@/features/subscriptions';
import { listOwnerCustomerMemberships } from '@/features/subscriptions/server/listOwnerCustomerMemberships';
import { loadMembershipsAccess } from '@/features/subscriptions/server/loadMembershipsAccess';
import { loadOwnerMembershipsState } from '@/features/subscriptions/server/loadOwnerMembershipsState';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SubscriptionsDashboardPage({
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

  const businessResolved = await resolveCurrentBusinessId(supabase);
  if (!businessResolved.ok) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const businessId = businessResolved.businessId;

  const shouldHandleConnectQuery =
    connectFlag === 'return' || connectFlag === 'refresh';

  if (shouldHandleConnectQuery) {
    logConnect('subscriptions.connect_callback', {
      userId: user.id,
      businessId,
      connect: connectFlag,
    });
    if (process.env.STRIPE_SECRET_KEY?.trim()) {
      const syncResult = await syncConnectPaymentAccountForBusiness(
        supabase,
        businessId
      );
      if (!syncResult.ok) {
        console.error(
          'SubscriptionsDashboardPage: Connect sync failed',
          syncResult.error
        );
      }
    }
    redirect(ROUTES.DASHBOARD.SUBSCRIPTIONS);
  }

  const [loadResult, access, subscribersResult] = await Promise.all([
    loadOwnerMembershipsState(supabase, businessId),
    loadMembershipsAccess(supabase, user.id, businessId, user.email),
    listOwnerCustomerMemberships(supabase, businessId),
  ]);

  if (!access.inRollout) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  return (
    <OwnerSubscriptionsPage
      loadResult={loadResult}
      access={access}
      subscribers={
        subscribersResult.ok ? subscribersResult.subscribers : undefined
      }
    />
  );
}
