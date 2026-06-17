import { randomUUID } from 'crypto';
import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createReviewInviteIfEligible,
  type CreateReviewInviteResult,
} from './createReviewInviteIfEligible';
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
  if (result.skipped) {
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
 * Post-completion hook: create + deliver the review invite (SMS-first, email
 * fallback). Best-effort. Returns the underlying result so the completion flow
 * can decide whether a separate completion notification is still needed.
 */
export async function applyReviewInviteOnBookingCompleted(
  supabase: SupabaseClient,
  booking: BookingRow,
  trace?: ReviewInviteLogTrace
): Promise<CreateReviewInviteResult> {
  const activeTrace =
    trace ??
    buildReviewInviteTrace(randomUUID(), 'web_patch', {
      businessId: booking.business_id,
      bookingId: booking.id,
    });

  try {
    const result = await createReviewInviteIfEligible(supabase, booking);
    logResult(activeTrace, result);
    return result;
  } catch (err) {
    const error = err instanceof Error ? err.message : 'unknown';
    logReviewInviteFinished(activeTrace, { kind: 'failed', error });
    return { ok: false, error };
  }
}
