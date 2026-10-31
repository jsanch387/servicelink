import { CustomerManagementPage } from '@/features/customer-management';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  await requireDashboardPageAccess('customers.read');

  return <CustomerManagementPage />;
}
