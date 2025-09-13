import { Dashboard } from '@/features/dashboard/components/Dashboard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Dashboard>{children}</Dashboard>;
}
