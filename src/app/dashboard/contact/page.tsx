import { ROUTES } from '@/constants/routes';
import { DashboardContactContent } from '@/features/contact/components/DashboardContactContent';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardContactPage() {
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

  const accountEmail = user.email?.trim();
  if (!accountEmail) {
    redirect(ROUTES.DASHBOARD.SETTINGS);
  }

  return <DashboardContactContent accountEmail={accountEmail} />;
}
