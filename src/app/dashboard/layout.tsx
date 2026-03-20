import { DashboardWrapper } from '@/features/dashboard/components/DashboardWrapper';
import { MetaCompleteRegistrationTracker } from '@/features/analytics';
import { Metadata } from 'next';

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardWrapper>
      <MetaCompleteRegistrationTracker />
      {children}
    </DashboardWrapper>
  );
}
