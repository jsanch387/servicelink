import { SettingsContent } from '@/features/dashboard/components/SettingsContent';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Settings Page
 *
 * Shows app settings including link management.
 * Redirects to dashboard if onboarding is not completed.
 */
export default async function SettingsPage() {
  console.log('⚙️ Settings page loading...');

  try {
    // Create Supabase client
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

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ User not authenticated, redirecting to login');
      redirect('/auth/login');
    }

    console.log('✅ Authenticated user found:', user.id);

    // Get complete onboarding state
    const stateResult = await getOnboardingState(user.id);
    if (!stateResult.success) {
      console.error('❌ Failed to get onboarding state:', stateResult.error);
      redirect('/dashboard');
    }

    const { status, businessProfile } = stateResult.data!;

    // Only allow access if onboarding is completed
    if (status !== 'completed') {
      console.log('❌ Onboarding not completed, redirecting to dashboard');
      redirect('/dashboard');
    }

    if (!businessProfile) {
      console.log('❌ Business profile not found, redirecting to dashboard');
      redirect('/dashboard');
    }
    console.log('✅ Business profile loaded:', {
      id: businessProfile.id,
      businessName: businessProfile.business_name,
    });

    // Fetch slug data directly from database
    const { data: slugData, error: slugError } = await supabase
      .from('business_profiles')
      .select('business_slug, business_link')
      .eq('id', businessProfile.id)
      .single();

    if (slugError) {
      console.error('❌ Failed to fetch slug data:', slugError);
      redirect('/dashboard');
    }

    // Prepare settings data
    const hasSlug = !!(slugData.business_slug && slugData.business_link);
    const settingsData = {
      businessProfile: {
        id: businessProfile.id,
        business_name: businessProfile.business_name,
        business_type: businessProfile.business_type,
        service_area: businessProfile.service_area,
        bio: businessProfile.bio,
        created_at: businessProfile.created_at,
        updated_at: businessProfile.updated_at,
      },
      slugData: hasSlug
        ? {
            hasSlug: true,
            slug: slugData.business_slug,
            fullLink: slugData.business_link,
          }
        : {
            hasSlug: false,
          },
    };

    console.log('✅ Settings data prepared:', {
      businessProfileId: settingsData.businessProfile.id,
      hasSlug: settingsData.slugData?.hasSlug,
      slug: settingsData.slugData?.slug,
    });

    return (
      <div className="min-h-screen bg-neutral-900">
        <SettingsContent
          businessProfile={businessProfile}
          settingsData={settingsData}
        />
      </div>
    );
  } catch (error) {
    console.error('❌ Error loading settings page:', error);
    redirect('/dashboard');
  }
}
