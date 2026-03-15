import {
  BusinessProfileApi,
  isOnboardingCompleted,
} from '@/features/business-profile';
import { BusinessProfileView } from '@/features/business-profile/components/BusinessProfileView';
import { isProAccess } from '@/features/pricing';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

// Force dynamic rendering (requires authentication)
export const dynamic = 'force-dynamic';

/**
 * Business Profile Page with Server-Side Rendering
 *
 * Shows business profile if onboarding is completed.
 * Redirects to dashboard if onboarding is not completed.
 *
 * URL Parameters:
 * - mode: 'view' | 'edit' - determines initial edit mode
 */
export default async function BusinessProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  // Await searchParams since it's now a Promise in Next.js 15
  const params = await searchParams;

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

  // Get user profile to check onboarding status and subscription tier
  const { data: userProfileData, error: profileError } = await supabase
    .from('profiles')
    .select(
      'onboarding_status, user_id, subscription_tier, subscription_current_period_end'
    )
    .eq('user_id', user.id)
    .single();

  const userProfile = userProfileData as {
    onboarding_status: 'not_started' | 'in_progress' | 'completed';
    user_id: string;
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
  } | null;

  if (profileError || !userProfile) {
    redirect('/login');
  }

  // Check if onboarding is completed
  if (!isOnboardingCompleted(userProfile.onboarding_status)) {
    redirect('/dashboard');
  }

  // Get business profile by profile_id (including slug data)
  const { data: businessProfileRow, error: businessProfileError } =
    await supabase
      .from('business_profiles')
      .select('id, business_slug, business_link')
      .eq('profile_id', userProfile.user_id)
      .single();

  const businessProfileData = businessProfileRow as {
    id: string;
    business_slug: string | null;
    business_link: string | null;
  } | null;

  if (businessProfileError || !businessProfileData) {
    redirect('/dashboard');
  }

  // Check if user has a slug configured
  const hasSlug = !!(
    businessProfileData.business_slug && businessProfileData.business_link
  );

  // Prepare slug data
  const slugData = hasSlug
    ? {
        hasSlug: true,
        slug: businessProfileData.business_slug ?? undefined,
        fullLink: businessProfileData.business_link ?? undefined,
      }
    : {
        hasSlug: false,
      };

  // Get complete business profile
  const profileResult = await BusinessProfileApi.getCompleteBusinessProfile(
    businessProfileData.id
  );

  if (!profileResult.success || !profileResult.data) {
    redirect('/dashboard');
  }

  const businessProfile = profileResult.data;

  // Determine initial edit mode from URL parameters
  const initialMode = params.mode === 'edit' ? 'edit' : 'view';

  const hasProAccess = isProAccess(
    userProfile?.subscription_tier,
    userProfile?.subscription_current_period_end
  );
  const isFreeTier = !hasProAccess;
  const showVerifiedBadge = hasProAccess;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <BusinessProfileView
        businessProfile={businessProfile}
        initialMode={initialMode}
        slugData={slugData}
        isFreeTier={isFreeTier}
        showVerifiedBadge={showVerifiedBadge}
      />
    </div>
  );
}
