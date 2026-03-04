/**
 * Services Dashboard Page
 *
 * Manage services: edit, reorder, toggle on/off.
 */

import type { BusinessServiceRow } from '@/features/business-profile/types/businessProfile';
import { ServicesContent } from '@/features/services';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
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

  const { data: services, error: servicesError } = await supabase
    .from('business_services')
    .select('*')
    .eq('business_id', businessProfile.id)
    .order('created_at', { ascending: true });

  const servicesList = servicesError ? [] : (services ?? []);

  return <ServicesContent initialServices={servicesList as BusinessServiceRow[]} />;
}
