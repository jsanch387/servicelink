import { CreateInvoiceScreen } from '@/features/invoices';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
  const { supabase, context } =
    await requireDashboardPageAccess('invoices.write');

  const { data: businessRow } = await supabase
    .from('business_profiles')
    .select('business_name')
    .eq('id', context.businessId)
    .maybeSingle();

  const businessName = businessRow?.business_name?.trim() || 'Your business';

  return <CreateInvoiceScreen businessName={businessName} />;
}
