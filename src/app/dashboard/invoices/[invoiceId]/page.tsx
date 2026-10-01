import { ROUTES } from '@/constants/routes';
import { CreateInvoiceScreen } from '@/features/invoices';
import { CreateInvoiceSkeleton } from '@/features/invoices/components/CreateInvoiceSkeleton';
import { InvoiceBillScreen } from '@/features/invoices/components/InvoiceBillScreen';
import { InvoiceBillSkeleton } from '@/features/invoices/components/InvoiceBillSkeleton';
import { loadInvoiceBill } from '@/features/invoices/server/loadInvoiceBill';
import { loadInvoiceDraft } from '@/features/invoices/server/loadInvoiceDraft';
import { isOwnerEmailAllowedForInvoicesRollout } from '@/features/invoices/config/invoicesRolloutAllowlist';
import { loadInvoiceEditorKind } from '@/features/invoices/server/loadInvoiceEditorKind';
import { businessCanUseInvoices } from '@/features/invoices/server/requireInvoicePro';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

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

  const { supabase, user, context } =
    await requireDashboardPageAccess('invoices.write');
  if (!isOwnerEmailAllowedForInvoicesRollout(user.email)) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const canUseInvoices = await businessCanUseInvoices(context.businessId);
  if (!canUseInvoices) redirect(ROUTES.DASHBOARD.INVOICES);

  const kind = await loadInvoiceEditorKind(supabase, context.businessId, id);
  if (!kind) redirect(ROUTES.DASHBOARD.INVOICES);

  if (kind === 'bill') {
    return (
      <Suspense fallback={<InvoiceBillSkeleton />}>
        <InvoiceBill
          invoiceId={id}
          businessId={context.businessId}
          supabase={supabase}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<CreateInvoiceSkeleton />}>
      <InvoiceEditor
        invoiceId={id}
        businessId={context.businessId}
        supabase={supabase}
      />
    </Suspense>
  );
}

async function InvoiceBill({
  invoiceId,
  businessId,
  supabase,
}: {
  invoiceId: string;
  businessId: string;
  supabase: Awaited<ReturnType<typeof requireDashboardPageAccess>>['supabase'];
}) {
  const bill = await loadInvoiceBill(supabase, businessId, invoiceId);
  if (!bill) redirect(ROUTES.DASHBOARD.INVOICES);
  return <InvoiceBillScreen invoice={bill} invoiceId={invoiceId} />;
}

async function InvoiceEditor({
  invoiceId,
  businessId,
  supabase,
}: {
  invoiceId: string;
  businessId: string;
  supabase: Awaited<ReturnType<typeof requireDashboardPageAccess>>['supabase'];
}) {
  const loaded = await loadInvoiceDraft(supabase, businessId, invoiceId);
  if (!loaded.ok) redirect(ROUTES.DASHBOARD.INVOICES);

  const { data: businessRow } = await supabase
    .from('business_profiles')
    .select('business_name')
    .eq('id', businessId)
    .maybeSingle();
  const businessName =
    (businessRow as { business_name?: string | null } | null)?.business_name?.trim() ||
    'Your business';

  return (
    <CreateInvoiceScreen
      businessName={businessName}
      invoiceId={invoiceId}
      initialDraft={loaded.draft}
    />
  );
}
