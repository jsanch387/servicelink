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
  console.log('🏠 Dashboard page loading...');

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
    console.log('❌ No authenticated user, redirecting to login');
    redirect('/auth/login');
  }

  console.log('✅ Authenticated user found:', user.id);

  // Get complete onboarding state
  const stateResult = await getOnboardingState(user.id);

  if (!stateResult.success) {
    console.error('❌ Failed to get onboarding state:', stateResult.error);
    // If we can't determine state, redirect to login for safety
    redirect('/auth/login');
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

  console.log('📊 Dashboard decision:', {
    status,
    currentStep,
    hasBusinessProfile: !!businessProfile,
    servicesCount: status === 'completed' ? 'N/A (skipped)' : services.length,
    imagesCount: status === 'completed' ? 'N/A (skipped)' : images.length,
    hasContactInfo:
      status === 'completed'
        ? 'N/A (skipped)'
        : !!(contactInfo.phone_number_call || contactInfo.phone_number_text),
  });

  // Render based on onboarding status
  switch (status) {
    case 'not_started':
      console.log('📝 Onboarding not started - showing Step 1');
      return <OnboardingFlow profileId={user.id} initialStep={1} />;

    case 'in_progress':
      console.log(`📝 Onboarding in progress - showing Step ${currentStep}`);
      return (
        <OnboardingFlow
          profileId={user.id}
          businessProfileId={businessProfile?.id}
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
      console.log('✅ Onboarding completed - fetching dashboard data');

      // Fetch comprehensive dashboard data
      const dashboardResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/data`,
        {
          headers: {
            Cookie: cookies().toString(),
          },
        }
      );

      if (!dashboardResponse.ok) {
        console.error('❌ Failed to fetch dashboard data');
        redirect('/auth/login');
      }

      const dashboardResult = await dashboardResponse.json();
      if (!dashboardResult.success) {
        console.error('❌ Dashboard data fetch failed:', dashboardResult.error);
        redirect('/auth/login');
      }

      console.log('✅ Dashboard data loaded:', {
        hasSlug: dashboardResult.data.slugData?.hasSlug,
        completeness: dashboardResult.data.analytics.profileCompleteness,
        readyToShare: dashboardResult.data.nextSteps.readyToShare,
      });

      return <DashboardContent dashboardData={dashboardResult.data} />;

    default:
      console.error('❌ Unknown onboarding status:', status);
      redirect('/auth/login');
  }
}
