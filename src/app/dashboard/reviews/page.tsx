import { ReviewsDashboardPage } from '@/features/reviews';
import { isGoogleReviewsRolloutEmail } from '@/features/reviews/google-connect/googleReviewsRolloutAllowlist';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';
import { createSupabaseServerClient } from '@/libs/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardReviewsPage() {
  await requireDashboardPageAccess('reviews.read');

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ReviewsDashboardPage
      showGoogleConnect={isGoogleReviewsRolloutEmail(user?.email)}
    />
  );
}
