import { resolveBusinessSpecialties } from '@/constants/businessSpecialties';
import type { PresetKey } from '@/features/availability/components/QuickPresetsSection';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import { DashboardContent } from '@/features/dashboard/components/DashboardContent';
import {
  isFreeTierFromProfileRow,
  loadDashboardShopView,
} from '@/features/dashboard/server/loadDashboardShopView';
import { OnboardingFlowV2 } from '@/features/onboarding-v2';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { can } from '@/features/team/constants/teamPermissions';
import { resolveDashboardContext } from '@/features/team/server/resolveDashboardContext';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

// Force dynamic rendering (requires authentication)
export const dynamic = 'force-dynamic';

/**
 * Dashboard Page with Server-Side Rendering
 *
 * Clean logic based purely on onboarding_status:
 * - not_started: Show onboarding Step 1
 * - in_progress: Show onboarding at current step with existing data
 * - completed: Show dashboard content
 */
export default async function DashboardPage() {
  // Create server client for SSR
  const supabase = await createSupabaseServerClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get complete onboarding state
  const stateResult = await getOnboardingState(user.id, supabase);

  if (!stateResult.success) {
    // If we can't determine state, redirect to login for safety
    redirect('/login');
  }

  const {
    status,
    currentStep,
    businessProfile,
    services: existingServices,
  } = stateResult.data!;

  // Map old onboarding services to v2 shape (for step 2 resume)
  const initialStep2Services = Array.isArray(existingServices)
    ? (
        existingServices as Array<{
          id?: string;
          name?: string;
          price?: string;
          hours_to_complete?: number | null;
          description?: string | null;
        }>
      ).map(s => ({
        id: s.id ?? `loaded-${Math.random().toString(36).slice(2)}`,
        name: (s.name as string) ?? '',
        price: (s.price as string) ?? '',
        durationMinutes: Math.round((s.hours_to_complete ?? 0) * 60 || 60),
        description: (s.description as string) || undefined,
      }))
    : undefined;

  let initialStep3:
    | { schedule?: WeeklySchedule; selectedPreset?: PresetKey | null }
    | undefined;
  if (
    (status === 'not_started' || status === 'in_progress') &&
    businessProfile?.id
  ) {
    try {
      const availability = await getAvailabilityForBusiness(
        supabase,
        businessProfile.id
      );
      if (availability?.weekly_schedule) {
        initialStep3 = {
          schedule: availability.weekly_schedule as WeeklySchedule,
          selectedPreset:
            (availability.selected_preset as PresetKey | null) ?? null,
        };
      }
    } catch {
      // ignore; step 3 will use defaults
    }
  }

  const access = await resolveDashboardContext(supabase);

  if (
    (status === 'not_started' || status === 'in_progress') &&
    access.ok &&
    !access.context.isOwner &&
    can(access.context, 'dashboard.read')
  ) {
    const dashboardData = await loadDashboardShopView(
      supabase,
      access.context.businessId,
      { isFreeTier: false }
    );
    if (!dashboardData) {
      redirect('/login');
    }
    return <DashboardContent dashboardData={dashboardData} />;
  }

  // Render based on onboarding status (new signups and in-progress see v2 flow)
  switch (status) {
    case 'not_started':
    case 'in_progress':
      return (
        <OnboardingFlowV2
          profileId={user.id}
          businessProfileId={businessProfile?.id as string | undefined}
          currentStep={currentStep}
          initialStep1={{
            businessName: (businessProfile?.business_name as string) ?? '',
            businessType: (businessProfile?.business_type as string) ?? '',
            specialties: resolveBusinessSpecialties(
              (businessProfile?.business_type as string) ?? '',
              (businessProfile as { specialties?: string[] | null } | null)
                ?.specialties
            ),
          }}
          initialStep2={
            initialStep2Services?.length
              ? { services: initialStep2Services }
              : undefined
          }
          initialStep3={initialStep3}
          initialStep4={
            (businessProfile as Record<string, unknown>)?.business_slug
              ? {
                  slug: String(
                    (businessProfile as Record<string, unknown>).business_slug
                  ),
                }
              : undefined
          }
        />
      );

    case 'completed': {
      if (!access.ok || !can(access.context, 'dashboard.read')) {
        redirect('/login');
      }

      const { data: profileRow } = await supabase
        .from('profiles')
        .select(
          'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
        )
        .eq('user_id', user.id)
        .maybeSingle();
      const isFreeTier = access.context.isOwner
        ? isFreeTierFromProfileRow(
            profileRow as {
              subscription_tier?: string | null;
              subscription_current_period_end?: string | null;
              subscription_status?: string | null;
              stripe_subscription_id?: string | null;
              stripe_customer_id?: string | null;
            } | null
          )
        : false;

      const dashboardData = await loadDashboardShopView(
        supabase,
        access.context.businessId,
        { isFreeTier }
      );

      if (!dashboardData) {
        redirect('/login');
      }

      return <DashboardContent dashboardData={dashboardData} />;
    }

    default:
      redirect('/login');
  }
}
