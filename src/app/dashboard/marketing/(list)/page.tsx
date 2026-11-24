import { MarketingPage } from '@/features/marketing';
import { requireCompletedShopPage } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

export default async function Marketing() {
  await requireCompletedShopPage('marketing.write');

  return <MarketingPage />;
}
