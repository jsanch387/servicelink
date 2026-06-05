/**
 * Service Edit Page
 *
 * Full-page edit for a single service: details + add-ons pool (display only for now).
 * Fetches service by ID and add-ons from DB, renders ServiceEditScreen.
 */

import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import {
  getAddOns,
  getServiceAddOnIds,
  getServicePriceOptions,
  getServices,
  ServiceEditScreen,
} from '@/features/services';
import { hasPriceOptionsAccess } from '@/features/services/utils/priceOptionsAccess';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { notFound, redirect } from 'next/navigation';

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

  const stateResult = await getOnboardingState(user.id, supabase);
  if (!stateResult.success || !stateResult.data) {
    redirect('/dashboard');
  }

  const { status, businessProfile } = stateResult.data;
  if (status !== 'completed' || !businessProfile?.id) {
    redirect('/dashboard');
  }

  const [servicesResult, addOnsResult, assignedResult, optionsResult] =
    await Promise.all([
      getServices(businessProfile.id),
      getAddOns(businessProfile.id),
      getServiceAddOnIds(serviceId),
      getServicePriceOptions(serviceId, businessProfile.id),
    ]);

  const canUsePriceOptions = await hasPriceOptionsAccess({
    supabase,
    userId: user.id,
  });

  if (!servicesResult.success || !servicesResult.data) {
    redirect('/dashboard/services');
  }

  const service = servicesResult.data.find(s => s.id === serviceId);
  if (!service) {
    notFound();
  }

  const addOns =
    addOnsResult.success && addOnsResult.data ? addOnsResult.data : [];
  const initialSelectedAddOnIds =
    assignedResult.success && assignedResult.data ? assignedResult.data : [];
  const initialPriceOptions =
    optionsResult.success && optionsResult.data ? optionsResult.data : [];

  return (
    <ServiceEditScreen
      businessId={businessProfile.id}
      service={service}
      initialAddOns={addOns}
      initialSelectedAddOnIds={initialSelectedAddOnIds}
      initialPriceOptions={initialPriceOptions}
      canUsePriceOptions={canUsePriceOptions}
      backHref="/dashboard/services"
    />
  );
}
