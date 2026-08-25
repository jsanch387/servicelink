/**
 * GET /api/internal/cron/booking-reminders
 *
 * Thin route. Auth + response shape live in `src/features/cron`.
 * Job work lives in availability (owner push + customer email/SMS).
 */

import { runBookingReminders } from '@/features/availability/booking/server/reminders';
import { handleCronGet } from '@/features/cron';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export const runtime = 'nodejs';
/** Vercel Pro allows 300s — sequential email+SMS was dying at 60s. */
export const maxDuration = 300;

export const GET = handleCronGet(async ({ request }) => {
  const admin = createSupabaseAdminClient();
  return runBookingReminders(admin, {
    correlationId: request.headers.get('x-vercel-id'),
  });
});
