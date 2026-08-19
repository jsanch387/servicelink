/**
 * When an owner cancels/deletes a booking that was the current period visit,
 * unlink it so the membership returns to Needs visit, then nudge the owner
 * (in-app + push) so they can rebook or send the schedule link.
 * Does not re-notify the customer (they already get the booking cancel email).
 */

import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import {
  isMembershipCancelScheduled,
  mapMembershipStatusToOwner,
} from './mapCustomerMembershipToOwnerSubscriber';
import {
  logMemberships,
  shortIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import { resolveMembershipVisitStatus } from './membershipVisitStatus';
import { notifyOwnerMembershipVisitNeeded } from './notifyOwnerMembershipVisitNeeded';
import { customerMembershipsOf } from './membershipTablesQuery';

type ClearedMembershipRow = {
  id: string;
  business_id: string;
  customer_name: string | null;
  status: string | null;
  cancel_at_period_end: boolean | null;
  cancel_at: string | null;
  current_period_start: string | null;
};

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
    .select(
      'id, business_id, customer_name, status, cancel_at_period_end, cancel_at, current_period_start'
    )
    .eq('business_id', businessId)
    .eq('period_visit_booking_id', bookingId);

  if (loadErr) {
    logMemberships(args.requestId, 'warn', 'period_visit.clear_load_failed', {
      bookingId: shortIdForLog(bookingId),
      ...supabaseErrorForLogs(loadErr),
    });
    return { cleared: false };
  }

  const memberships = (rows ?? []) as ClearedMembershipRow[];
  if (!memberships.length) return { cleared: false };

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
    memberships: memberships.length,
  });

  for (const row of memberships) {
    try {
      const status = mapMembershipStatusToOwner(String(row.status ?? ''));
      const cancelScheduled = isMembershipCancelScheduled(row);
      const visitStatus = resolveMembershipVisitStatus({
        status,
        cancelScheduled,
        currentPeriodStart: row.current_period_start,
        periodVisitBookingId: null,
        periodVisitPeriodStart: null,
      });
      const periodStart = row.current_period_start?.trim();
      if (visitStatus !== 'needs_visit' || !periodStart) continue;

      await notifyOwnerMembershipVisitNeeded(admin, {
        businessId: String(row.business_id ?? businessId),
        membershipId: row.id,
        customerName: row.customer_name?.trim() || null,
        periodStart,
        dedupeSuffix: `cleared:${bookingId}`,
        requestId: args.requestId,
      });
    } catch (err) {
      logMemberships(
        args.requestId,
        'warn',
        'visit_needed.after_clear_failed',
        {
          membershipId: shortIdForLog(row.id),
          bookingId: shortIdForLog(bookingId),
          error: err instanceof Error ? err.message : 'unknown',
        }
      );
    }
  }

  return { cleared: true };
}
