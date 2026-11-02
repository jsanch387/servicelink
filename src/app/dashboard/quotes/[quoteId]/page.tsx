import { ROUTES } from '@/constants/routes';
import { QuoteDetailScreen } from '@/features/quotes/dashboard';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ quoteId: string }>;
}

export default async function DashboardQuoteDetailPage({ params }: PageProps) {
  const { quoteId } = await params;
  if (!quoteId?.trim()) {
    redirect(ROUTES.DASHBOARD.QUOTES);
  }

  await requireDashboardPageAccess('quotes.read');

  return <QuoteDetailScreen quoteId={quoteId} />;
}
