/**
 * GET /api/internal/cron/google-review-pulls
 *
 * Daily refresh of connected Google Business reviews.
 * Work lives in reviews google-connect.
 */

import { handleCronGet } from '@/features/cron';
import { runScheduledGoogleReviewPulls } from '@/features/reviews/google-connect/server/runScheduledGoogleReviewPulls';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 300;

export const GET = handleCronGet(async () => {
  const admin = createSupabaseAdminClient();
  return runScheduledGoogleReviewPulls(admin);
});
