import { randomUUID } from 'crypto';
import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createReviewInviteIfEligible } from './createReviewInviteIfEligible';
import {
  buildReviewInviteTrace,
  logReviewInviteFinished,
  type ReviewInviteLogTrace,
} from './reviewInviteRouteLog';

function logResult(
  trace: ReviewInviteLogTrace,
  result: Awaited<ReturnType<typeof createReviewInviteIfEligible>>
): void {
  if (!result.ok) {
    logReviewInviteFinished(trace, { kind: 'failed', error: result.error });
    return;
  }
  if ('skipped' in result && result.skipped) {
    logReviewInviteFinished(trace, {
      kind: 'skipped',
      reason: result.reason,
    });
    return;
  }
  if (!result.sent) {
    logReviewInviteFinished(trace, {
      kind: 'invite_no_email',
      inviteId: result.inviteId,
      emailErrorHint: result.emailErrorHint,
    });
    return;
  }
  logReviewInviteFinished(trace, {
    kind: 'sent',
    inviteId: result.inviteId,
  });
}

/**
 * Post-completion hook: review invite email (best-effort).
 */
export async function applyReviewInviteOnBookingCompleted(
  supabase: SupabaseClient,
  booking: BookingRow,
  trace?: ReviewInviteLogTrace
): Promise<void> {
  const activeTrace =
    trace ??
    buildReviewInviteTrace(randomUUID(), 'web_patch', {
      businessId: booking.business_id,
      bookingId: booking.id,
    });

  try {
    const result = await createReviewInviteIfEligible(supabase, booking);
    logResult(activeTrace, result);
  } catch (err) {
    logReviewInviteFinished(activeTrace, {
      kind: 'failed',
      error: err instanceof Error ? err.message : 'unknown',
    });
  }
}
