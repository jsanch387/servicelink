import {
  BusinessProfileApi,
  isOnboardingCompleted,
} from '@/features/business-profile';
import { BusinessProfileView } from '@/features/business-profile/components/BusinessProfileView';
import { OnboardingCheckoutReturnGate } from '@/features/onboarding-v2/components/OnboardingCheckoutReturnGate';
import {
  isProAccess,
  isProAccessForPublicQuoteRequests,
} from '@/features/pricing';
import {
  loadPublicReviewSummary,
  publicReviewSummaryFromLoadResult,
} from '@/features/reviews';
import {
  BOOKING_FLOW_LOCALE_COOKIE_NAME,
  normalizePublicBookingOfferedLocales,
  resolvePublicBookingFlowLocale,
} from '@/libs/bookingFlowLocale';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { cookies } from 'next/headers';
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
  searchParams: Promise<{ mode?: string; onboarding?: string }>;
}) {
  // Await searchParams since it's now a Promise in Next.js 15
  const params = await searchParams;
  const onboardingComplete = params.onboarding === 'complete';

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
      'onboarding_status, user_id, subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id, profile_welcome_modal_seen'
    )
    .eq('user_id', user.id)
    .single();

  const userProfile = userProfileData as {
    onboarding_status: 'not_started' | 'in_progress' | 'completed';
    user_id: string;
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
    subscription_status?: string | null;
    stripe_subscription_id?: string | null;
    stripe_customer_id?: string | null;
    profile_welcome_modal_seen?: boolean | null;
  } | null;

  if (profileError || !userProfile) {
    redirect('/login');
  }

  // Check if onboarding is completed
  if (!isOnboardingCompleted(userProfile.onboarding_status)) {
    if (onboardingComplete) {
      return <OnboardingCheckoutReturnGate />;
    }
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

  const cookieStore = await cookies();
  const bookingFlowLocale = resolvePublicBookingFlowLocale({
    offeredLocales: normalizePublicBookingOfferedLocales(
      businessProfile.public_booking_locales
    ),
    businessDefaultLocale: businessProfile.public_booking_default_locale,
    searchParamsLang: undefined,
    cookieValue: cookieStore.get(BOOKING_FLOW_LOCALE_COOKIE_NAME)?.value,
  });

  // Determine initial edit mode from URL parameters
  const initialMode = params.mode === 'edit' ? 'edit' : 'view';

  const hasProAccess = isProAccess(
    userProfile?.subscription_tier,
    userProfile?.subscription_current_period_end,
    userProfile?.subscription_status,
    userProfile?.stripe_subscription_id,
    userProfile?.stripe_customer_id
  );
  const isFreeTier = !hasProAccess;
  const showVerifiedBadge = hasProAccess;
  const showRequestQuoteCta =
    isProAccessForPublicQuoteRequests(
      userProfile?.subscription_tier,
      userProfile?.subscription_current_period_end,
      userProfile?.subscription_status,
      userProfile?.stripe_subscription_id,
      userProfile?.stripe_customer_id
    ) && businessProfile.accept_quote_req === true;
  // After step 5, free users see Try Pro first, then this welcome (client-sequence).
  const showProfileWelcomeModalOnLoad =
    onboardingComplete && userProfile?.profile_welcome_modal_seen !== true;

  const admin = createSupabaseAdminClient();
  const publicReviewSummaryResult = await loadPublicReviewSummary(
    admin,
    businessProfileData.id
  );
  const publicReviewSummary = publicReviewSummaryFromLoadResult(
    publicReviewSummaryResult
  );
  const publicProfileSlug =
    businessProfileData.business_slug?.trim() || undefined;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <BusinessProfileView
        businessProfile={businessProfile}
        initialMode={initialMode}
        slugData={slugData}
        isFreeTier={isFreeTier}
        showVerifiedBadge={showVerifiedBadge}
        onboardingCompleteFromUrl={onboardingComplete}
        showProfileWelcomeModalOnLoad={showProfileWelcomeModalOnLoad}
        showRequestQuoteCta={showRequestQuoteCta}
        bookingFlowLocale={bookingFlowLocale}
        publicReviewSummary={publicReviewSummary}
        publicProfileSlug={publicProfileSlug}
      />
    </div>
  );
}
