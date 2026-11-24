import { CreatePromoCodePage } from '@/features/marketing/components/CreatePromoCodePage';
import { requireCompletedShopPage } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

interface EditPromoCodePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPromoCodePage({
  params,
}: EditPromoCodePageProps) {
  const { id } = await params;
  await requireCompletedShopPage('marketing.write');

  return <CreatePromoCodePage promoCodeId={id} />;
}
