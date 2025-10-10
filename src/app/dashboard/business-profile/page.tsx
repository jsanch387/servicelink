import {
  BusinessProfileApi,
  isOnboardingCompleted,
} from '@/features/business-profile';
import { BusinessProfileView } from '@/features/business-profile/components/BusinessProfileView';
import { createServerClient } from '@supabase/ssr';
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
  searchParams: Promise<{ mode?: string }>;
}) {
  console.log('🏢 Business Profile page loading...');

  // Await searchParams since it's now a Promise in Next.js 15
  const params = await searchParams;

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

  // Get user profile to check onboarding status and get profile_id
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('onboarding_status, user_id')
    .eq('user_id', user.id)
    .single();

  if (profileError) {
    console.error('❌ Failed to get user profile:', profileError);
    redirect('/auth/login');
  }

  // Check if onboarding is completed
  if (!isOnboardingCompleted(userProfile.onboarding_status)) {
    console.log('📝 Onboarding not completed, redirecting to dashboard');
    redirect('/dashboard');
  }

  console.log('✅ Onboarding completed, fetching business profile');

  // Get business profile by profile_id (including slug data)
  const { data: businessProfileData, error: businessProfileError } =
    await supabase
      .from('business_profiles')
      .select('id, business_slug, business_link')
      .eq('profile_id', userProfile.user_id)
      .single();

  if (businessProfileError || !businessProfileData) {
    console.error('❌ No business profile found:', businessProfileError);
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
        slug: businessProfileData.business_slug,
        fullLink: businessProfileData.business_link,
      }
    : {
        hasSlug: false,
      };

  // Get complete business profile
  const profileResult = await BusinessProfileApi.getCompleteBusinessProfile(
    businessProfileData.id
  );

  if (!profileResult.success || !profileResult.data) {
    console.error('❌ Failed to get business profile:', profileResult.error);
    redirect('/dashboard');
  }

  const businessProfile = profileResult.data;

  console.log('✅ Business profile loaded:', {
    id: businessProfile.id,
    businessName: businessProfile.business_name,
    servicesCount: businessProfile.services.length,
    imagesCount: businessProfile.images.length,
  });

  // Determine initial edit mode from URL parameters
  const initialMode = params.mode === 'edit' ? 'edit' : 'view';
  console.log('🎯 Initial mode from URL:', initialMode);

  return (
    <div className="min-h-screen bg-neutral-900">
      <BusinessProfileView
        businessProfile={businessProfile}
        initialMode={initialMode}
        slugData={slugData}
      />
    </div>
  );
}
