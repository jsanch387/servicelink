import { CreatePromoCodePage } from '@/features/marketing/components/CreatePromoCodePage';
import { requireCompletedShopPage } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

export default async function NewPromoCodePage() {
  await requireCompletedShopPage('marketing.write');

  return <CreatePromoCodePage />;
}
