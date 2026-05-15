/**
 * Services Dashboard Page
 *
 * Fetches services from the database and renders the services management UI.
 * Auth and onboarding are required; loading and errors are handled in the feature.
 */

import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { isProAccess, FREE_MAX_SERVICES } from '@/features/pricing';
import {
  getAddOnCounts,
  getAddOns,
  getServices,
  ServicesWithAddOnsView,
} from '@/features/services';
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

  const servicesResult = await getServices(businessProfile.id);
  const services = servicesResult.data ?? [];

  const { data: profileRow } = await supabase
    .from('profiles')
    .select(
      'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  const p = profileRow as {
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
    subscription_status?: string | null;
    stripe_subscription_id?: string | null;
    stripe_customer_id?: string | null;
  } | null;

  const hasProAccess = isProAccess(
    p?.subscription_tier,
    p?.subscription_current_period_end,
    p?.subscription_status,
    p?.stripe_subscription_id,
    p?.stripe_customer_id
  );

  const freeTierServiceCapReached =
    !hasProAccess && services.length >= FREE_MAX_SERVICES;

  const [addOnsResult, addOnCounts] = await Promise.all([
    getAddOns(businessProfile.id),
    getAddOnCounts(
      businessProfile.id,
      services.map(s => s.id)
    ),
  ]);

  return (
    <ServicesWithAddOnsView
      initialServices={services}
      fetchError={servicesResult.success ? null : servicesResult.error}
      addOnCounts={addOnCounts}
      initialAddOns={addOnsResult.data ?? []}
      addOnsFetchError={addOnsResult.success ? null : addOnsResult.error}
      freeTierServiceCapReached={freeTierServiceCapReached}
    />
  );
}
