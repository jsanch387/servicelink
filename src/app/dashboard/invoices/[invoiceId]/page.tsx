import { ROUTES } from '@/constants/routes';
import { CreateInvoiceScreen } from '@/features/invoices';
import { InvoiceBillScreen } from '@/features/invoices/components/InvoiceBillScreen';
import { loadInvoiceBill } from '@/features/invoices/server/loadInvoiceBill';
import { loadInvoiceDraft } from '@/features/invoices/server/loadInvoiceDraft';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const INVOICE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ invoiceId: string }>;
}

export default async function InvoiceDraftPage({ params }: PageProps) {
  const { invoiceId } = await params;
  const id = invoiceId?.trim() ?? '';
  if (!INVOICE_ID.test(id)) {
    redirect(ROUTES.DASHBOARD.INVOICES);
  }

  const { supabase, context } =
    await requireDashboardPageAccess('invoices.write');

  const loaded = await loadInvoiceDraft(supabase, context.businessId, id);
  if (loaded.ok) {
    const { data: businessRow } = await supabase
      .from('business_profiles')
      .select('business_name')
      .eq('id', context.businessId)
      .maybeSingle();

    const businessName = businessRow?.business_name?.trim() || 'Your business';

    return (
      <CreateInvoiceScreen
        businessName={businessName}
        invoiceId={id}
        initialDraft={loaded.draft}
      />
    );
  }

  const bill = await loadInvoiceBill(supabase, context.businessId, id);
  if (bill) {
    return <InvoiceBillScreen invoice={bill} invoiceId={id} />;
  }

  redirect(ROUTES.DASHBOARD.INVOICES);
}
