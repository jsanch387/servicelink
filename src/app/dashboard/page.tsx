import { DashboardContent } from '@/features/dashboard/components/DashboardContent';
import { OnboardingFlow } from '@/features/onboarding/components/OnboardingFlow';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

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
    // userProfile, // Will be used later
    businessProfile,
    services,
    images,
    contactInfo,
  } = stateResult.data!;

  // Render based on onboarding status
  switch (status) {
    case 'not_started':
      return <OnboardingFlow profileId={user.id} initialStep={1} />;

    case 'in_progress':
      return (
        <OnboardingFlow
          profileId={user.id}
          businessProfileId={businessProfile?.id as string}
          initialStep={currentStep}
          existingData={{
            ...businessProfile,
            services: services,
            images: images,
            ...contactInfo,
          }}
        />
      );

    case 'completed':
      // Fetch business profile with counts directly from database
      const { data: profile, error: profileError } = await supabase
        .from('business_profiles')
        .select(
          `
          id, business_name, business_type, service_area, bio, created_at, updated_at,
          business_slug, business_link,
          services:business_services(count),
          images:business_images(count)
        `
        )
        .eq('profile_id', user.id)
        .single();

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
              slug: profile.business_slug,
              fullLink: profile.business_link,
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
            hasSlug &&
            servicesCount > 0 &&
            imagesCount > 0 &&
            profile.bio &&
            profile.bio.trim().length >= 50,
        },
      };

      return <DashboardContent dashboardData={dashboardData} />;

    default:
      redirect('/login');
  }
}
