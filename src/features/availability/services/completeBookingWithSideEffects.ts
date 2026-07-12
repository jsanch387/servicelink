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
import { recordPromoCodeRedemptionForCompletedBooking } from '@/features/marketing/server/recordPromoCodeRedemptionForCompletedBooking';
import { applyReviewInviteOnBookingCompleted } from '@/features/reviews/server/applyReviewInviteOnBookingCompleted';
import type { NotifyChannelOutcome } from '@/features/reviews/server/createReviewInviteIfEligible';
import {
  buildReviewInviteTrace,
  type ReviewInviteLogSource,
} from '@/features/reviews/server/reviewInviteRouteLog';
import { pausedSmsChannelOutcome } from '@/features/sms/config/smsOutboundPaused';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { updateBookingStatus } from './bookingService';

export interface CompleteBookingLog {
  requestId: string;
  /** Where the completion originated, for review-invite logs. */
  source: ReviewInviteLogSource;
}

/**
 * The single completion notification, split per channel (SMS-first, email
 * fallback — never both). Mirrors the mobile API response 1:1.
 */
export interface CompletionNotification {
  sms: NotifyChannelOutcome;
  email: NotifyChannelOutcome;
}

export interface CompleteBookingResult {
  booking: BookingRow;
  notification: CompletionNotification;
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
    await recordPromoCodeRedemptionForCompletedBooking(admin, updated);
  } catch (sideErr) {
    console.error('[completeBooking] promo redemption side effect', sideErr);
  }

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
  // with email fallback, never both. Surface both channel outcomes as-is.
  if (reviewResult.ok && !reviewResult.skipped) {
    return {
      booking: updated,
      notification: { sms: reviewResult.sms, email: reviewResult.email },
    };
  }

  // Not review-eligible (already reviewed / no contact method / create failed):
  // send a plain "thank you, job complete" SMS courtesy, no email.
  // SMS_OUTBOUND_PAUSED — docs/sms-outbound-paused.md (web PATCH complete courtesy)
  /*
  const reason = reviewResult.ok ? reviewResult.reason : 'error';
  const businessName =
    (await loadBusinessName(admin, updated.business_id)) || 'Your appointment';
  const smsResult = await sendAndRecordSms({
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

  const sms: NotifyChannelOutcome = smsResult.sent
    ? { sent: true, messageId: smsResult.messageId, reason: null }
    : { sent: false, messageId: null, reason: smsResult.reason };
  */
  const reason = reviewResult.ok ? reviewResult.reason : 'error';
  const sms: NotifyChannelOutcome = pausedSmsChannelOutcome();
  // Email is only "no_email" when there was genuinely no way to reach them;
  // otherwise it was intentionally not attempted (e.g. already reviewed).
  const email: NotifyChannelOutcome = {
    sent: false,
    messageId: null,
    reason: reason === 'no_contact_method' ? 'no_email' : null,
  };

  return { booking: updated, notification: { sms, email } };
}
