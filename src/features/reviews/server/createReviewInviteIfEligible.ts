import { getPublicReviewPath } from '@/constants/routes';
import { getAppBaseUrl } from '@/features/email/services/resendClient';
import { sendReviewInviteEmail } from '@/features/email/review-invite/sendReviewInviteEmail';
import { normalizedCustomerRecipientEmail } from '@/features/email/utils/normalizedCustomerRecipientEmail';
import { pausedSmsChannelOutcome } from '@/features/sms/config/smsOutboundPaused';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import { ensureReviewInviteRecordIfEligible } from './ensureReviewInviteRecordIfEligible';

/** Which channel delivered (or attempted) the review invite. */
export type ReviewInviteChannel = 'sms' | 'email' | 'none';

/** Per-channel delivery outcome, mirrored 1:1 in the mobile API response. */
export interface NotifyChannelOutcome {
  sent: boolean;
  messageId: string | null;
  /** Null when sent, or when the channel wasn't attempted. */
  reason: string | null;
}

export type CreateReviewInviteResult =
  | {
      ok: true;
      skipped: false;
      /** Overall: a review link was delivered on at least one channel. */
      sent: boolean;
      /** `sms` (link texted), `email` (fallback), or `none` (both failed). */
      channel: ReviewInviteChannel;
      inviteId: string;
      sms: NotifyChannelOutcome;
      email: NotifyChannelOutcome;
    }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

const NOT_ATTEMPTED: NotifyChannelOutcome = {
  sent: false,
  messageId: null,
  reason: null,
};

/** Map a `sendReviewInviteEmail` error string to a stable mobile reason code. */
function emailFailureReason(
  error: string
): 'no_email' | 'not_configured' | 'error' {
  if (/RESEND_API_KEY/i.test(error)) return 'not_configured';
  if (/recipient email/i.test(error)) return 'no_email';
  return 'error';
}

async function loadBusinessName(
  supabase: SupabaseClient,
  businessId: string
): Promise<string> {
  const { data } = await supabase
    .from('business_profiles')
    .select('business_name')
    .eq('id', businessId)
    .maybeSingle();

  const name = (data as { business_name?: string | null } | null)
    ?.business_name;
  return typeof name === 'string' ? name.trim() : '';
}

async function markInvite(
  supabase: SupabaseClient,
  inviteId: string,
  patch: Record<string, unknown>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('review_invites')
    .update(patch)
    .eq('id', inviteId);
}

/**
 * On booking completed: create a review invite (if eligible) and deliver it on a
 * single channel — **SMS first** (the review link is texted to the customer),
 * falling back to **email** only when there's no phone or the SMS fails. The two
 * are never both sent (no double notification). Best-effort; callers should not
 * fail the booking status update when this errors.
 */
export async function createReviewInviteIfEligible(
  supabase: SupabaseClient,
  booking: Pick<
    BookingRow,
    | 'id'
    | 'business_id'
    | 'customer_id'
    | 'customer_email'
    | 'customer_phone'
    | 'customer_name'
    | 'service_name'
    | 'scheduled_date'
    | 'start_time'
  >
): Promise<CreateReviewInviteResult> {
  const bookingId = booking.id?.trim();
  const businessId = booking.business_id?.trim();
  const customerId = booking.customer_id?.trim() ?? '';

  if (!bookingId || !businessId) {
    return { ok: false, error: 'Invalid booking context' };
  }

  if (!customerId) {
    return { ok: true, skipped: true, reason: 'no_customer_id' };
  }

  const recipient = normalizedCustomerRecipientEmail(
    booking.customer_email ?? ''
  );
  const phone = booking.customer_phone?.trim() || '';

  // Need at least one channel to reach the customer.
  if (!recipient && !phone) {
    return { ok: true, skipped: true, reason: 'no_contact_method' };
  }

  const record = await ensureReviewInviteRecordIfEligible(supabase, booking);
  if (!record.ok) {
    return { ok: false, error: record.error };
  }
  if (record.skipped) {
    return { ok: true, skipped: true, reason: record.reason };
  }

  const businessName = await loadBusinessName(supabase, businessId);
  const publicReviewUrl = `${getAppBaseUrl()}${getPublicReviewPath(
    record.rawReviewToken
  )}`;

  const inviteId = record.inviteId;
  const now = new Date().toISOString();

  let sms: NotifyChannelOutcome = { ...NOT_ATTEMPTED };
  let email: NotifyChannelOutcome = { ...NOT_ATTEMPTED };

  // 1. SMS first — text the review link (priority channel).
  // SMS_OUTBOUND_PAUSED — docs/sms-outbound-paused.md (review_invite)
  if (phone) {
    sms = pausedSmsChannelOutcome();
  } else {
    sms = { sent: false, messageId: null, reason: 'no_phone' };
  }
  /*
  if (phone) {
    const smsResult = await sendAndRecordSms({
      admin: supabase as unknown as SupabaseClient<Database>,
      businessId,
      bookingId,
      customerId,
      type: 'review_invite',
      to: phone,
      message: buildReviewRequestSms({
        reviewUrl: publicReviewUrl,
      }),
      dedupeKey: `${bookingId}:review_invite`,
      correlationId: bookingId,
    });

    if (smsResult.sent) {
      await markInvite(supabase, inviteId, {
        sms_sent_at: now,
        last_notification_error: null,
      });
      return {
        ok: true,
        skipped: false,
        sent: true,
        channel: 'sms',
        inviteId,
        sms: { sent: true, messageId: smsResult.messageId, reason: null },
        email,
      };
    }
    // SMS failed (invalid number, provider error) → record + try email below.
    sms = { sent: false, messageId: null, reason: smsResult.reason };
  } else {
    sms = { sent: false, messageId: null, reason: 'no_phone' };
  }
  */

  // 2. Email fallback — only when SMS wasn't possible or failed.
  if (recipient) {
    const customerName =
      booking.customer_name?.trim() || recipient.split('@')[0] || 'there';

    const emailResult = await sendReviewInviteEmail(recipient, {
      customerName,
      businessName: businessName || 'Your provider',
      serviceName: booking.service_name?.trim() || 'Your service',
      scheduledDate: booking.scheduled_date,
      scheduledStartTime: String(booking.start_time ?? '').trim(),
      publicReviewUrl,
    });

    if (emailResult.sent) {
      await markInvite(supabase, inviteId, {
        email_sent_at: now,
        last_notification_error: null,
      });
      return {
        ok: true,
        skipped: false,
        sent: true,
        channel: 'email',
        inviteId,
        sms,
        email: { sent: true, messageId: emailResult.messageId, reason: null },
      };
    }

    await markInvite(supabase, inviteId, {
      last_notification_error: emailResult.error,
    });
    email = {
      sent: false,
      messageId: null,
      reason: emailFailureReason(emailResult.error),
    };
  } else {
    email = { sent: false, messageId: null, reason: 'no_email' };
  }

  // Neither channel delivered.
  return {
    ok: true,
    skipped: false,
    sent: false,
    channel: 'none',
    inviteId,
    sms,
    email,
  };
}
