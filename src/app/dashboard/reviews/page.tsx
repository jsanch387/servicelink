import { ReviewsDashboardPage } from '@/features/reviews';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

export default async function DashboardReviewsPage() {
  await requireDashboardPageAccess('reviews.read');

  return <ReviewsDashboardPage />;
}
