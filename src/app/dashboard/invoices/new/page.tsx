import { ROUTES } from '@/constants/routes';
import { CreateInvoiceScreen } from '@/features/invoices';
import { loadInvoiceDraftFromBooking } from '@/features/invoices/server/loadInvoiceDraftFromBooking';
import { businessCanUseInvoices } from '@/features/invoices/server/requireInvoicePro';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ booking?: string }>;
}

export default async function NewInvoicePage({ searchParams }: PageProps) {
  const { booking: bookingParam } = await searchParams;
  const { supabase, context } =
    await requireDashboardPageAccess('invoices.write');

  const canUseInvoices = await businessCanUseInvoices(context.businessId);
  if (!canUseInvoices) redirect(ROUTES.DASHBOARD.INVOICES);

  const fromBooking = bookingParam
    ? await loadInvoiceDraftFromBooking(
        supabase,
        context.businessId,
        bookingParam
      )
    : null;

  if (fromBooking?.kind === 'existing') {
    redirect(ROUTES.DASHBOARD.INVOICE(fromBooking.invoiceId));
  }

  const { data: businessRow } = await supabase
    .from('business_profiles')
    .select('business_name')
    .eq('id', context.businessId)
    .maybeSingle();

  const businessName = businessRow?.business_name?.trim() || 'Your business';

  return (
    <CreateInvoiceScreen
      businessName={businessName}
      initialDraft={
        fromBooking?.kind === 'draft' ? fromBooking.draft : undefined
      }
      bookingId={fromBooking?.kind === 'draft' ? fromBooking.bookingId : null}
    />
  );
}
