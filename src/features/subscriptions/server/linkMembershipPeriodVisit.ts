/**
 * After an owner books a membership visit, attach it to the current Stripe period.
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  logMemberships,
  shortIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import { customerMembershipsOf } from './membershipTablesQuery';

export async function linkMembershipPeriodVisit(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    membershipId: string;
    bookingId: string;
    customerId?: string | null;
    requestId?: string;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const businessId = args.businessId.trim();
  const membershipId = args.membershipId.trim();
  const bookingId = args.bookingId.trim();
  if (!businessId || !membershipId || !bookingId) {
    return { ok: false, error: 'Missing membership or booking id.' };
  }

  const { data: row, error: loadErr } = await customerMembershipsOf(supabase)
    .select('id, business_id, current_period_start, customer_id')
    .eq('id', membershipId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (loadErr || !row) {
    logMemberships(args.requestId, 'error', 'period_visit.link_load_failed', {
      membershipId: shortIdForLog(membershipId),
      ...supabaseErrorForLogs(loadErr),
    });
    return { ok: false, error: 'Membership not found.' };
  }

  const periodStart = (row.current_period_start as string | null)?.trim();
  if (!periodStart) {
    return { ok: false, error: 'Membership has no current billing period.' };
  }

  const customerId =
    args.customerId?.trim() ||
    (row.customer_id as string | null)?.trim() ||
    null;

  const { error: updateErr } = await customerMembershipsOf(supabase)
    .update({
      period_visit_booking_id: bookingId,
      period_visit_period_start: periodStart,
      ...(customerId ? { customer_id: customerId } : {}),
    })
    .eq('id', membershipId)
    .eq('business_id', businessId);

  if (updateErr) {
    logMemberships(args.requestId, 'error', 'period_visit.link_failed', {
      membershipId: shortIdForLog(membershipId),
      bookingId: shortIdForLog(bookingId),
      ...supabaseErrorForLogs(updateErr),
    });
    return { ok: false, error: 'Could not link visit to membership.' };
  }

  return { ok: true };
}
