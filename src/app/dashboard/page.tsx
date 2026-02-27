import type { PresetKey } from '@/features/availability/components/QuickPresetsSection';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import { DashboardContent } from '@/features/dashboard/components/DashboardContent';
import { OnboardingFlowV2 } from '@/features/onboarding-v2';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

type DashboardProfileRow = {
  id: string;
  business_name: string;
  business_type: string | null;
  service_area: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  business_slug: string | null;
  business_link: string | null;
  legacy_request_booking_enabled: boolean | null;
  services: { count: number }[] | null;
  images: { count: number }[] | null;
};

type BusinessAvailabilityRow = {
  accept_bookings: boolean | null;
};

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
  const stateResult = await getOnboardingState(user.id);

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

    case 'completed':
      // Fetch business profile with counts and legacy booking flag
      const { data: profileData, error: profileError } = await supabase
        .from('business_profiles')
        .select(
          `
          id, business_name, business_type, service_area, bio, created_at, updated_at,
          business_slug, business_link, legacy_request_booking_enabled,
          services:business_services(count),
          images:business_images(count)
        `
        )
        .eq('profile_id', user.id)
        .single();

      const profile = profileData as DashboardProfileRow | null;

      if (profileError || !profile) {
        redirect('/login');
      }

      // Calculate analytics
      const servicesCount =
        (profile.services as { count: number }[])?.[0]?.count || 0;
      const imagesCount =
        (profile.images as { count: number }[])?.[0]?.count || 0;
      const hasSlug = !!(profile.business_slug && profile.business_link);

      // Calculate profile completeness
      const checks = [
        profile.business_name,
        profile.business_type,
        profile.service_area,
        profile.bio && profile.bio.trim().length >= 50,
        hasSlug,
        servicesCount > 0,
        imagesCount > 0,
      ];
      const profileCompleteness = Math.round(
        (checks.filter(Boolean).length / checks.length) * 100
      );

      // Pending booking requests count (V1 only)
      const { count: pendingRequestsCount } = await supabase
        .from('booking_requests')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', profile.id)
        .eq('status', 'pending');

      // V2: availability on? and upcoming (confirmed) bookings count
      const { data: availabilityRow } = await supabase
        .from('business_availability')
        .select('accept_bookings')
        .eq('business_id', profile.id)
        .maybeSingle();
      const availability = availabilityRow as BusinessAvailabilityRow | null;
      const useAvailabilityBooking = availability?.accept_bookings === true;
      const today = new Date().toISOString().slice(0, 10);
      let upcomingBookingsCount = 0;
      if (useAvailabilityBooking) {
        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', profile.id)
          .eq('status', 'confirmed')
          .gte('scheduled_date', today);
        upcomingBookingsCount = count ?? 0;
      }

      const legacyRequestBookingEnabled =
        profile.legacy_request_booking_enabled === true;

      // Prepare dashboard data
      const dashboardData = {
        businessProfile: {
          id: profile.id,
          business_name: profile.business_name,
          business_type: profile.business_type,
          service_area: profile.service_area,
          bio: profile.bio,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        },
        slugData: hasSlug
          ? {
              hasSlug: true,
              slug: profile.business_slug ?? undefined,
              fullLink: profile.business_link ?? undefined,
              createdAt: profile.updated_at,
            }
          : { hasSlug: false },
        analytics: {
          servicesCount,
          imagesCount,
          profileCompleteness,
        },
        nextSteps: {
          needsSlug: !hasSlug,
          needsServices: servicesCount === 0,
          needsImages: imagesCount === 0,
          needsBio: !profile.bio || profile.bio.trim().length < 50,
          readyToShare:
            !!hasSlug &&
            servicesCount > 0 &&
            imagesCount > 0 &&
            !!profile.bio &&
            profile.bio.trim().length >= 50,
        },
        pendingRequestsCount: pendingRequestsCount ?? 0,
        legacyRequestBookingEnabled,
        useAvailabilityBooking,
        upcomingBookingsCount,
      };

      return <DashboardContent dashboardData={dashboardData} />;

    default:
      redirect('/login');
  }
}
