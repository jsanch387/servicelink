import { InvoicesDashboardPage } from '@/features/invoices';
import { InvoicesNotProGate } from '@/features/invoices/components/InvoicesNotProGate';
import { businessCanUseInvoices } from '@/features/invoices/server/requireInvoicePro';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

export default async function DashboardInvoicesPage() {
  const { context } = await requireDashboardPageAccess('invoices.read');
  const canUseInvoices = await businessCanUseInvoices(context.businessId);
  if (!canUseInvoices) return <InvoicesNotProGate />;

  return <InvoicesDashboardPage />;
}
