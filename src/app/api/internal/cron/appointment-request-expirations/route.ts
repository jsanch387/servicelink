/**
 * GET /api/internal/cron/appointment-request-expirations
 *
 * Requests whose calendar day has ended become expired, and the customer
 * is told once.
 */

import {
  appointmentRequestExpiryDate,
  expirePastAppointmentRequests,
} from '@/features/availability/services/expirePastAppointmentRequests';
import { handleCronGet } from '@/features/cron';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 300;

export const GET = handleCronGet(async () => {
  const admin = createSupabaseAdminClient();
  const asOf = appointmentRequestExpiryDate();
  const result = await expirePastAppointmentRequests(admin, { asOf });
  return { asOf, ...result };
});
