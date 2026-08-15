/**
 * When an owner cancels/deletes a booking that was the current period visit,
 * unlink it so the membership returns to Needs visit.
 */

import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import {
  logMemberships,
  shortIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import { customerMembershipsOf } from './membershipTablesQuery';

export async function clearMembershipPeriodVisitForBooking(args: {
  businessId: string;
  bookingId: string;
  requestId?: string;
}): Promise<{ cleared: boolean }> {
  const businessId = args.businessId.trim();
  const bookingId = args.bookingId.trim();
  if (!businessId || !bookingId) return { cleared: false };

  const admin = createSupabaseAdminClient();
  const { data: rows, error: loadErr } = await customerMembershipsOf(admin)
    .select('id')
    .eq('business_id', businessId)
    .eq('period_visit_booking_id', bookingId);

  if (loadErr) {
    logMemberships(args.requestId, 'warn', 'period_visit.clear_load_failed', {
      bookingId: shortIdForLog(bookingId),
      ...supabaseErrorForLogs(loadErr),
    });
    return { cleared: false };
  }

  if (!rows?.length) return { cleared: false };

  const { error: updateErr } = await customerMembershipsOf(admin)
    .update({
      period_visit_booking_id: null,
      period_visit_period_start: null,
    })
    .eq('business_id', businessId)
    .eq('period_visit_booking_id', bookingId);

  if (updateErr) {
    logMemberships(args.requestId, 'warn', 'period_visit.clear_failed', {
      bookingId: shortIdForLog(bookingId),
      ...supabaseErrorForLogs(updateErr),
    });
    return { cleared: false };
  }

  logMemberships(args.requestId, 'info', 'period_visit.cleared', {
    bookingId: shortIdForLog(bookingId),
    memberships: rows.length,
  });
  return { cleared: true };
}
