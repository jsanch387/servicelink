import { InvoicesDashboardPage } from '@/features/invoices';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

export default async function DashboardInvoicesPage() {
  await requireDashboardPageAccess('invoices.read');

  return <InvoicesDashboardPage />;
}
