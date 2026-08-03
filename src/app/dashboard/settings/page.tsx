import { SettingsContent } from '@/features/settings';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { isProAccess } from '@/features/pricing';
import { getSubscriptionPriceDisplay } from '@/features/pricing/server/getSubscriptionMonthlyPriceDisplay';
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
  searchParams: Promise<{
    checkout?: string;
    email_notice?: string;
    /** @deprecated Prefer `email_notice=updated` */
    email_updated?: string;
  }>;
}) {
  const params = await searchParams;
  const checkoutSuccess = params?.checkout === 'success';
  const emailNotice =
    params?.email_notice === 'updated' || params?.email_notice === 'error'
      ? params.email_notice
      : params?.email_updated === '1'
        ? ('updated' as const)
        : null;
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
    const stateResult = await getOnboardingState(user.id, supabase);
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
          'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id, subscription_cancel_at_period_end, subscription_billing_interval'
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
      stripe_subscription_id?: string | null;
      stripe_customer_id?: string | null;
      subscription_cancel_at_period_end?: boolean | null;
      subscription_billing_interval?: string | null;
    } | null;
    const hasProAccess = isProAccess(
      profileRow?.subscription_tier,
      profileRow?.subscription_current_period_end,
      profileRow?.subscription_status,
      profileRow?.stripe_subscription_id,
      profileRow?.stripe_customer_id
    );
    const planId = hasProAccess ? ('pro' as const) : ('free' as const);

    const storedBillingInterval =
      profileRow?.subscription_billing_interval === 'year'
        ? 'year'
        : profileRow?.subscription_billing_interval === 'month'
          ? 'month'
          : null;
    let subscriptionMonthlyPrice: string | null = null;
    let subscriptionBillingInterval: 'month' | 'year' | null =
      storedBillingInterval;
    const subscriptionId = profileRow?.stripe_subscription_id?.trim();
    if (hasProAccess && subscriptionId) {
      const priceDisplay = await getSubscriptionPriceDisplay(subscriptionId);
      subscriptionMonthlyPrice = priceDisplay?.amount ?? null;
      subscriptionBillingInterval =
        storedBillingInterval ?? priceDisplay?.interval ?? null;
    }

    const signedInWithGoogle = !(user.identities ?? []).some(
      identity => identity.provider === 'email'
    );

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
      subscriptionCurrentPeriodEnd:
        profileRow?.subscription_current_period_end ?? null,
      subscriptionCancelAtPeriodEnd:
        profileRow?.subscription_cancel_at_period_end === true,
      subscriptionMonthlyPrice,
      subscriptionBillingInterval,
      accountEmail: user.email ?? '',
      signedInWithGoogle,
      pendingEmail: user.new_email ?? null,
    };

    return (
      <SettingsContent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        businessProfile={businessProfile as any}
        settingsData={settingsData}
        checkoutSuccess={checkoutSuccess}
        emailNotice={emailNotice}
      />
    );
  } catch {
    redirect('/dashboard');
  }
}
