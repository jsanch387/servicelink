import { PublicInvoicePageShell } from '@/features/availability/booking/public/components/PublicInvoicePageShell';
import { loadPublicBookingInvoiceByToken } from '@/features/availability/booking/server/loadPublicBookingInvoiceByToken';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { notFound } from 'next/navigation';

interface PublicInvoicePageProps {
  params: Promise<{ publicToken: string }>;
}

export default async function PublicInvoicePage({
  params,
}: PublicInvoicePageProps) {
  const { publicToken } = await params;
  const raw = decodeURIComponent(publicToken ?? '').trim();
  if (!raw) {
    notFound();
  }

  const admin = createSupabaseAdminClient();
  const loaded = await loadPublicBookingInvoiceByToken(admin, raw);

  if (!loaded.ok) {
    notFound();
  }

  return <PublicInvoicePageShell snapshot={loaded.invoice.snapshot} />;
}
