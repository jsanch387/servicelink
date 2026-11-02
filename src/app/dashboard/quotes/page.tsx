import { QuotesDashboardPage } from '@/features/quotes/components/QuotesDashboardPage';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

export default async function DashboardQuotesPage() {
  await requireDashboardPageAccess('quotes.read');

  return <QuotesDashboardPage isFreeTier={false} />;
}
