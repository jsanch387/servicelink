import { CreateSalePage } from '@/features/marketing/components/CreateSalePage';
import { requireCompletedShopPage } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

export default async function NewSalePage() {
  await requireCompletedShopPage('marketing.write');

  return <CreateSalePage />;
}
