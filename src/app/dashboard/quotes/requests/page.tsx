import { QuoteRequestsDashboardPage } from '@/features/quotes/components/QuoteRequestsDashboardPage';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardQuoteRequestsPage() {
  const { supabase, context } = await requireDashboardPageAccess('quotes.read');

  const { data: businessRow, error: businessError } = await supabase
    .from('business_profiles')
    .select('id, accept_quote_req')
    .eq('id', context.businessId)
    .maybeSingle();

  if (businessError || !businessRow) {
    redirect('/dashboard');
  }

  const acceptQuoteRequests =
    (businessRow as { accept_quote_req?: boolean | null }).accept_quote_req ===
    true;

  return (
    <QuoteRequestsDashboardPage
      isFreeTier={false}
      acceptQuoteRequests={acceptQuoteRequests}
    />
  );
}
