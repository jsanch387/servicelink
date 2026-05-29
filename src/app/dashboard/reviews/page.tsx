import { ROUTES } from '@/constants/routes';
import { ReviewsDashboardPage } from '@/features/reviews';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardReviewsPage() {
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

  const { data: businessRow, error: businessError } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (businessError || !businessRow) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  return <ReviewsDashboardPage />;
}
