/**
 * GET /api/internal/cron/quote-customer-reminders
 *
 * Thin route. Auth + response shape live in `src/features/cron`.
 * Job work lives in quotes (customer email + SMS for unanswered sent quotes).
 */

import { handleCronGet } from '@/features/cron';
import { runQuoteCustomerReminders } from '@/features/quotes/server/reminders';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 300;

export const GET = handleCronGet(async () => {
  const admin = createSupabaseAdminClient();
  return runQuoteCustomerReminders(admin);
});
