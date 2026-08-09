import { DashboardWrapper } from '@/features/dashboard/components/DashboardWrapper';
import { isOwnerEmailAllowedForMembershipsRollout } from '@/features/subscriptions/config/membershipsRolloutAllowlist';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';

/** Layout reads onboarding status; must not use a stale shell after step 5 completes. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard - ServiceLink',
  description:
    'Manage your business profile, services, and portfolio. Update your professional business profile that customers can call you directly from.',
  openGraph: {
    title: 'Dashboard - ServiceLink',
    description: 'Manage your business profile, services, and portfolio.',
    type: 'website',
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  noStore();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isOnboardingCompleted = false;
  if (user?.id) {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('onboarding_status')
      .eq('user_id', user.id)
      .maybeSingle();

    isOnboardingCompleted =
      (profileRow as { onboarding_status?: string | null } | null)
        ?.onboarding_status === 'completed';
  }

  const showMembershipsNav = isOwnerEmailAllowedForMembershipsRollout(
    user?.email
  );

  return (
    <DashboardWrapper
      isOnboardingCompleted={isOnboardingCompleted}
      showMembershipsNav={showMembershipsNav}
    >
      {children}
    </DashboardWrapper>
  );
}
