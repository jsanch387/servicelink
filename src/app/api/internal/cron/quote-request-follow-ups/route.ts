/**
 * GET /api/internal/cron/quote-request-follow-ups
 *
 * Thin route. Auth + response shape live in `src/features/cron`.
 * Job work lives in quotes (owner digest for stale requests).
 */

import { handleCronGet } from '@/features/cron';
import { runQuoteRequestFollowUps } from '@/features/quotes/server/reminders';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const GET = handleCronGet(async () => {
  const admin = createSupabaseAdminClient();
  return runQuoteRequestFollowUps(admin);
});
