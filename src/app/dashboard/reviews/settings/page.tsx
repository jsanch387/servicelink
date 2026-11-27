import { ReviewsSettingsPage } from '@/features/reviews';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

export default async function DashboardReviewsSettingsPage() {
  await requireDashboardPageAccess('reviews.read');

  return <ReviewsSettingsPage />;
}
