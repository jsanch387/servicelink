import { ROUTES } from '@/constants/routes';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { CreateSubscriptionPlanPage } from '@/features/subscriptions';
import { getMembershipPlanForBusiness } from '@/features/subscriptions/server/getMembershipPlan';
import { loadMembershipsAccess } from '@/features/subscriptions/server/loadMembershipsAccess';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface EditSubscriptionPlanPageProps {
  params: Promise<{ planId: string }>;
}

export default async function EditSubscriptionPlanPage({
  params,
}: EditSubscriptionPlanPageProps) {
  const { planId } = await params;
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

  if (access.gate !== 'ready') {
    redirect(ROUTES.DASHBOARD.SUBSCRIPTIONS);
  }

  const plan = await getMembershipPlanForBusiness(
    supabase,
    businessResolved.businessId,
    planId
  );

  if (!plan) {
    notFound();
  }

  return <CreateSubscriptionPlanPage mode="edit" initialPlan={plan} />;
}
