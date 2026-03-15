import { SettingsContent } from '@/features/dashboard/components/SettingsContent';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { isProAccess } from '@/features/pricing';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

// Force dynamic rendering (requires authentication)
export const dynamic = 'force-dynamic';

/**
 * Settings Page
 *
 * Shows app settings including link management.
 * Redirects to dashboard if onboarding is not completed.
 * Supports ?checkout=success to show one-time Pro welcome modal after upgrade.
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const params = await searchParams;
  const checkoutSuccess = params?.checkout === 'success';
  try {
    const supabase = await createSupabaseServerClient();

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

    // Fetch slug data and subscription tier from database
    const [slugResult, profileResult] = await Promise.all([
      supabase
        .from('business_profiles')
        .select('business_slug, business_link')
        .eq('id', businessProfile.id)
        .single(),
      supabase
        .from('profiles')
        .select(
          'subscription_tier, subscription_current_period_end, subscription_status'
        )
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const { data: slugData, error: slugError } = slugResult;
    if (slugError || !slugData) {
      redirect('/dashboard');
    }

    const slug = slugData as {
      business_slug: string | null;
      business_link: string | null;
    };
    const hasSlug = !!(slug.business_slug && slug.business_link);

    const profileRow = profileResult.data as {
      subscription_tier?: string | null;
      subscription_current_period_end?: string | null;
      subscription_status?: string | null;
    } | null;
    const hasProAccess = isProAccess(
      profileRow?.subscription_tier,
      profileRow?.subscription_current_period_end
    );
    const planId = hasProAccess ? ('pro' as const) : ('free' as const);

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
            slug: slug.business_slug ?? undefined,
            fullLink: slug.business_link ?? undefined,
          }
        : {
            hasSlug: false,
          },
      planId,
      subscriptionStatus: profileRow?.subscription_status ?? null,
    };

    return (
      <SettingsContent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        businessProfile={businessProfile as any}
        settingsData={settingsData}
        checkoutSuccess={checkoutSuccess}
      />
    );
  } catch {
    redirect('/dashboard');
  }
}
