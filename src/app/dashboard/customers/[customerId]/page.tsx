import { ROUTES } from '@/constants/routes';
import { CustomerScreen } from '@/features/customer-management/components/CustomerScreen';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface CustomerPageProps {
  params: Promise<{ customerId: string }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  await requireDashboardPageAccess('customers.read');
  const { customerId } = await params;
  const id = customerId?.trim() ?? '';
  if (!id) redirect(ROUTES.DASHBOARD.CUSTOMERS);

  return <CustomerScreen customerId={id} />;
}
