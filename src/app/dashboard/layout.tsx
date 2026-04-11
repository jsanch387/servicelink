import { ROUTES } from '@/constants/routes';
import { MetaCompleteRegistrationTracker } from '@/features/analytics';
import { DashboardWrapper } from '@/features/dashboard/components/DashboardWrapper';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  return (
    <DashboardWrapper>
      <MetaCompleteRegistrationTracker />
      {children}
    </DashboardWrapper>
  );
}
