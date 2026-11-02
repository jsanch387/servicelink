import { ROUTES } from '@/constants/routes';
import { ReviewDetailPage } from '@/features/reviews';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ reviewId: string }>;
}

export default async function DashboardReviewDetailPage({ params }: PageProps) {
  const { reviewId } = await params;
  if (!reviewId?.trim()) {
    redirect(ROUTES.DASHBOARD.REVIEWS);
  }

  await requireDashboardPageAccess('reviews.read');

  return <ReviewDetailPage reviewId={reviewId.trim()} bookingFlowLocale="en" />;
}
