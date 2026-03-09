/**
 * Service Edit Page
 *
 * Full-page edit for a single service: details + add-ons assignment.
 * Fetches service by ID and renders ServiceEditScreen.
 */

import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { getServices, ServiceEditScreen } from '@/features/services';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect, notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ServiceEditPageProps {
  params: Promise<{ serviceId: string }>;
}

export default async function ServiceEditPage({
  params,
}: ServiceEditPageProps) {
  const supabase = await createSupabaseServerClient();
  const { serviceId } = await params;

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
  if (!result.success || !result.data) {
    redirect('/dashboard/services');
  }

  const service = result.data.find(s => s.id === serviceId);
  if (!service) {
    notFound();
  }

  // Mock: seed first 2 add-on IDs as selected for demo (UI prototype)
  const { MOCK_ADDONS_POOL } = await import(
    '@/features/services/components/add-ons/mockAddOnsPool'
  );
  const initialSelectedAddOnIds = MOCK_ADDONS_POOL.slice(0, 2).map(a => a.id);

  return (
    <ServiceEditScreen
      service={service}
      initialSelectedAddOnIds={initialSelectedAddOnIds}
      backHref="/dashboard/services"
    />
  );
}
