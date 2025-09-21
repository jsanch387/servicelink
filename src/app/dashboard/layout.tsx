import { Metadata } from 'next';
import { Dashboard } from '@/features/dashboard/components/Dashboard';

export const metadata: Metadata = {
  title: 'Dashboard - ServiceLink',
  description: 'Manage your business profile, services, and portfolio. Update your professional business profile that customers can call you directly from.',
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
  return <Dashboard>{children}</Dashboard>;
}
