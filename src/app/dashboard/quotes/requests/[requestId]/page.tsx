import { ROUTES } from '@/constants/routes';
import { QuoteRequestDetailScreen } from '@/features/quotes/dashboard';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ requestId: string }>;
}

export default async function DashboardQuoteRequestDetailPage({
  params,
}: PageProps) {
  const { requestId } = await params;
  if (!requestId?.trim()) {
    redirect(ROUTES.DASHBOARD.QUOTES_REQUESTS);
  }

  await requireDashboardPageAccess('quotes.read');

  return <QuoteRequestDetailScreen requestId={requestId} />;
}
