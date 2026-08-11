import { ROUTES } from '@/constants/routes';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { OwnerSubscriberDetailPage } from '@/features/subscriptions';
import { isOwnerEmailAllowedForMembershipsRollout } from '@/features/subscriptions/config/membershipsRolloutAllowlist';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface SubscriberDetailPageProps {
  params: Promise<{ subscriberId: string }>;
}

export default async function SubscriptionSubscriberDetailPage({
  params,
}: SubscriberDetailPageProps) {
  const { subscriberId } = await params;
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

  return <OwnerSubscriberDetailPage subscriberId={subscriberId} />;
}
