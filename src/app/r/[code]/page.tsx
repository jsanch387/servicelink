import { PublicInvoicePageShell } from '@/features/availability/booking/public/components/PublicInvoicePageShell';
import { loadPublicBookingInvoiceByShortCode } from '@/features/availability/booking/server/loadPublicBookingInvoiceByToken';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { notFound } from 'next/navigation';

interface PublicInvoiceShortPageProps {
  params: Promise<{ code: string }>;
}

export default async function PublicInvoiceShortPage({
  params,
}: PublicInvoiceShortPageProps) {
  const { code } = await params;
  const raw = decodeURIComponent(code ?? '').trim();
  if (!raw) {
    notFound();
  }

  const admin = createSupabaseAdminClient();
  const loaded = await loadPublicBookingInvoiceByShortCode(admin, raw);

  if (!loaded.ok) {
    notFound();
  }

  return <PublicInvoicePageShell snapshot={loaded.invoice.snapshot} />;
}
