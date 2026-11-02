import { ROUTES } from '@/constants/routes';
import { InvoicesDashboardPage } from '@/features/invoices';
import { InvoicesNotProGate } from '@/features/invoices/components/InvoicesNotProGate';
import { isOwnerEmailAllowedForInvoicesRollout } from '@/features/invoices/config/invoicesRolloutAllowlist';
import { businessCanUseInvoices } from '@/features/invoices/server/requireInvoicePro';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardInvoicesPage() {
  const { user, context } = await requireDashboardPageAccess('invoices.read');
  if (!isOwnerEmailAllowedForInvoicesRollout(user.email)) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }
  const canUseInvoices = await businessCanUseInvoices(context.businessId);
  if (!canUseInvoices) return <InvoicesNotProGate />;

  return <InvoicesDashboardPage />;
}
