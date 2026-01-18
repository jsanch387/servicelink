import { SettingsContent } from '@/features/dashboard/components/SettingsContent';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Force dynamic rendering (requires authentication)
export const dynamic = 'force-dynamic';

/**
 * Settings Page
 *
 * Shows app settings including link management.
 * Redirects to dashboard if onboarding is not completed.
 */
export default async function SettingsPage() {
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
      redirect('/login');
    }

    // Get complete onboarding state
    const stateResult = await getOnboardingState(user.id);
    if (!stateResult.success) {
      redirect('/dashboard');
    }

    const { status, businessProfile } = stateResult.data!;

    // Only allow access if onboarding is completed
    if (status !== 'completed') {
      redirect('/dashboard');
    }

    if (!businessProfile) {
      redirect('/dashboard');
    }

    // Fetch slug data directly from database
    const { data: slugData, error: slugError } = await supabase
      .from('business_profiles')
      .select('business_slug, business_link')
      .eq('id', businessProfile.id)
      .single();

    if (slugError) {
      redirect('/dashboard');
    }

    // Prepare settings data
    const hasSlug = !!(slugData.business_slug && slugData.business_link);
    const settingsData = {
      businessProfile: {
        id: businessProfile.id,
        business_name: businessProfile.business_name,
        business_type: businessProfile.business_type || null,
        service_area: businessProfile.service_area || null,
        bio: businessProfile.bio || null,
        created_at: businessProfile.created_at || '',
        updated_at: businessProfile.updated_at || '',
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

    return (
      <div className="min-h-screen bg-neutral-900">
        <SettingsContent
          businessProfile={businessProfile as any}
          settingsData={settingsData}
        />
      </div>
    );
  } catch {
    redirect('/dashboard');
  }
}
