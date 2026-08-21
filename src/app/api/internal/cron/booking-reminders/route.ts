/**
 * GET /api/internal/cron/booking-reminders
 *
 * Thin route. Auth + response shape live in `src/features/cron`.
 * Job work lives in availability.
 */

import { runOwnerBookingReminders } from '@/features/availability/booking/server/runOwnerBookingReminders';
import { handleCronGet } from '@/features/cron';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const GET = handleCronGet(async ({ request }) => {
  const admin = createSupabaseAdminClient();
  return runOwnerBookingReminders(admin, {
    correlationId: request.headers.get('x-vercel-id'),
  });
});
