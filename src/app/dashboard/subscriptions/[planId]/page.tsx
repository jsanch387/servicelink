import { ROUTES } from '@/constants/routes';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { OwnerSubscriptionPlanDetailPage } from '@/features/subscriptions';
import { isOwnerEmailAllowedForMembershipsRollout } from '@/features/subscriptions/config/membershipsRolloutAllowlist';
import { getMembershipPlanForBusiness } from '@/features/subscriptions/server/getMembershipPlan';
import { listOwnerCustomerMemberships } from '@/features/subscriptions/server/listOwnerCustomerMemberships';
import { loadMembershipsAccess } from '@/features/subscriptions/server/loadMembershipsAccess';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PlanDetailPageProps {
  params: Promise<{ planId: string }>;
}

export default async function SubscriptionPlanDetailPage({
  params,
}: PlanDetailPageProps) {
  const { planId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  if (!isOwnerEmailAllowedForMembershipsRollout(user.email)) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const stateResult = await getOnboardingState(user.id, supabase);
  if (!stateResult.success || stateResult.data?.status !== 'completed') {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const businessResolved = await resolveCurrentBusinessId(supabase);
  if (!businessResolved.ok) {
    redirect(ROUTES.DASHBOARD.SUBSCRIPTIONS);
  }

  const access = await loadMembershipsAccess(
    supabase,
    user.id,
    businessResolved.businessId,
    user.email
  );

  if (!access.inRollout) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  // View existing plans when Pro lapsed; other incomplete gates go back to list.
  if (access.gate !== 'ready' && access.gate !== 'not_pro') {
    redirect(ROUTES.DASHBOARD.SUBSCRIPTIONS);
  }

  const [plan, subscribersResult] = await Promise.all([
    getMembershipPlanForBusiness(supabase, businessResolved.businessId, planId),
    listOwnerCustomerMemberships(supabase, businessResolved.businessId, {
      planId,
    }),
  ]);

  if (!plan) {
    notFound();
  }

  return (
    <OwnerSubscriptionPlanDetailPage
      plan={plan}
      catalogWritable={access.gate === 'ready'}
      subscribers={
        subscribersResult.ok ? subscribersResult.subscribers : undefined
      }
    />
  );
}
