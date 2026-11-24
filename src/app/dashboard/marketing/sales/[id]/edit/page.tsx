import { CreateSalePage } from '@/features/marketing/components/CreateSalePage';
import { requireCompletedShopPage } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

interface EditSalePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSalePage({ params }: EditSalePageProps) {
  const { id } = await params;
  await requireCompletedShopPage('marketing.write');

  return <CreateSalePage saleId={id} />;
}
