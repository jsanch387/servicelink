/**
 * Mark a booking completed (lifecycle `status = 'completed'`) and run the
 * post-completion side effects in one place, so every completion path — the web
 * PATCH route and the mobile `job_completed` action — behaves identically.
 *
 * Side effects (all best-effort, never throw):
 *   1. Maintenance visit completion (advances maintenance enrollments).
 *   2. A single customer completion notification (no double-send):
 *      - Review-eligible (not yet reviewed): the review invite is delivered
 *        SMS-first (link texted) with an email fallback.
 *      - Otherwise (already reviewed / no contact needed): a plain "thank you,
 *        job complete" SMS courtesy, if the customer has a phone.
 *
 * `sessionClient` is the RLS-scoped owner client — it enforces that only the
 * owner can complete their own booking. `admin` is the service-role client used
 * for the side effects (which write across tables without an owner policy).
 *
 * Returns the updated booking row plus the notification outcome, or `null` if
 * the booking was not found / not permitted (caller should surface a 404).
 */

import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import { applyMaintenanceVisitCompletedFromBooking } from '@/features/maintenance/server/applyMaintenanceVisitCompletedFromBooking';
import { applyReviewInviteOnBookingCompleted } from '@/features/reviews/server/applyReviewInviteOnBookingCompleted';
import type { ReviewInviteChannel } from '@/features/reviews/server/createReviewInviteIfEligible';
import {
  buildReviewInviteTrace,
  type ReviewInviteLogSource,
} from '@/features/reviews/server/reviewInviteRouteLog';
import {
  buildJobCompletedSms,
  sendAndRecordSms,
  type SendAndRecordSmsResult,
} from '@/features/sms';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { updateBookingStatus } from './bookingService';

export interface CompleteBookingLog {
  requestId: string;
  /** Where the completion originated, for review-invite logs. */
  source: ReviewInviteLogSource;
}

/** How the single completion notification was handled. */
export interface CompletionNotification {
  review:
    | {
        requested: true;
        sent: boolean;
        channel: ReviewInviteChannel;
        inviteId: string;
      }
    | { requested: false; reason: string };
  /** SMS attempt (review link or plain thank-you), when one was made. */
  sms?: SendAndRecordSmsResult;
}

export interface CompleteBookingResult {
  booking: BookingRow;
  notification: CompletionNotification;
}

async function loadBusinessName(
  admin: SupabaseClient<Database>,
  businessId: string
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('business_profiles')
    .select('business_name')
    .eq('id', businessId)
    .maybeSingle();
  const name = (data as { business_name?: string | null } | null)
    ?.business_name;
  return typeof name === 'string' ? name.trim() : '';
}

export async function completeBookingWithSideEffects(
  sessionClient: SupabaseClient<Database>,
  admin: SupabaseClient<Database>,
  bookingId: string,
  log: CompleteBookingLog
): Promise<CompleteBookingResult | null> {
  const updated = await updateBookingStatus(
    sessionClient,
    bookingId,
    'completed'
  );
  if (!updated) return null;

  try {
    await applyMaintenanceVisitCompletedFromBooking(admin, {
      id: updated.id,
      business_id: updated.business_id,
      customer_id: updated.customer_id,
    });
  } catch (sideErr) {
    console.error(
      '[completeBooking] maintenance completion side effect',
      sideErr
    );
  }

  const reviewTrace = buildReviewInviteTrace(log.requestId, log.source, {
    businessId: updated.business_id,
    bookingId: updated.id,
  });
  const reviewResult = await applyReviewInviteOnBookingCompleted(
    admin,
    updated,
    reviewTrace
  );

  // The review invite (when created) IS the completion notification — SMS-first
  // with email fallback, never both. We only send a plain thank-you SMS when no
  // review was requested (e.g. the customer already reviewed).
  if (reviewResult.ok && !reviewResult.skipped) {
    return {
      booking: updated,
      notification: {
        review: {
          requested: true,
          sent: reviewResult.sent,
          channel: reviewResult.channel,
          inviteId: reviewResult.inviteId,
        },
        ...(reviewResult.smsResult ? { sms: reviewResult.smsResult } : {}),
      },
    };
  }

  const reason = reviewResult.ok ? reviewResult.reason : 'error';
  const businessName =
    (await loadBusinessName(admin, updated.business_id)) || 'Your appointment';
  const sms = await sendAndRecordSms({
    admin,
    businessId: updated.business_id,
    bookingId: updated.id,
    customerId: updated.customer_id,
    type: 'job_completed',
    to: updated.customer_phone,
    message: buildJobCompletedSms({ businessName }),
    dedupeKey: `${updated.id}:job_completed`,
    recipientId: `booking:${updated.id}`,
    correlationId: updated.id,
  });

  return {
    booking: updated,
    notification: {
      review: { requested: false, reason },
      sms,
    },
  };
}
