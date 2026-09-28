import { PublicInvoiceBill } from '@/features/invoices/components/PublicInvoiceBill';
import { confirmCustomerInvoiceCheckoutReturn } from '@/features/invoices/server/createCustomerInvoiceCheckout';
import { loadPublicInvoiceByShortCode } from '@/features/invoices/server/loadPublicInvoiceByShortCode';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PublicBillPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export default async function PublicBillPage({
  params,
  searchParams,
}: PublicBillPageProps) {
  const { code } = await params;
  const query = await searchParams;
  const raw = decodeURIComponent(code ?? '').trim();
  const admin = createSupabaseAdminClient();
  const sessionId = query.session_id?.trim() ?? '';

  if (sessionId) {
    await confirmCustomerInvoiceCheckoutReturn(admin, raw, sessionId);
  }

  const invoice = await loadPublicInvoiceByShortCode(admin, raw);

  if (!invoice) notFound();

  return <PublicInvoiceBill invoice={invoice} shortCode={raw} />;
}
