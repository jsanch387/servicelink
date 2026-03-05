/**
 * Services Dashboard Page
 *
 * Fetches services from the database and renders the services management UI.
 * Auth and onboarding are required; loading and errors are handled in the feature.
 */

import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { getServices, ServicesContent } from '@/features/services';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  const stateResult = await getOnboardingState(user.id);
  if (!stateResult.success || !stateResult.data) {
    redirect('/dashboard');
  }

  const { status, businessProfile } = stateResult.data;
  if (status !== 'completed' || !businessProfile?.id) {
    redirect('/dashboard');
  }

  const result = await getServices(businessProfile.id);

  return (
    <ServicesContent
      initialServices={result.data ?? []}
      fetchError={result.success ? null : result.error}
    />
  );
}
