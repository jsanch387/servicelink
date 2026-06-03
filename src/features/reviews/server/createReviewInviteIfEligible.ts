import crypto from 'crypto';
import { getPublicReviewPath } from '@/constants/routes';
import { getAppBaseUrl } from '@/features/email/services/resendClient';
import { sendReviewInviteEmail } from '@/features/email/review-invite/sendReviewInviteEmail';
import { normalizedCustomerRecipientEmail } from '@/features/email/utils/normalizedCustomerRecipientEmail';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';

const INVITE_EXPIRY_DAYS = 90;

export type CreateReviewInviteResult =
  | {
      ok: true;
      skipped: false;
      sent: boolean;
      inviteId: string;
      emailErrorHint?: string;
    }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

type ReviewInviteRow = {
  id: string;
  status: string;
  email_sent_at: string | null;
};

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

async function hasExistingReviewForCustomer(
  supabase: SupabaseClient,
  businessId: string,
  customerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id')
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return Boolean(data?.id);
}

async function hasPendingInviteForCustomer(
  supabase: SupabaseClient,
  businessId: string,
  customerId: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('review_invites')
    .select('id')
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return Boolean(data?.id);
}

async function findInviteByBookingId(
  supabase: SupabaseClient,
  bookingId: string
): Promise<ReviewInviteRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('review_invites')
    .select('id, status, email_sent_at')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return (data as ReviewInviteRow | null) ?? null;
}

function expiresAtFromNow(): string {
  const d = new Date();
  d.setDate(d.getDate() + INVITE_EXPIRY_DAYS);
  return d.toISOString();
}

/**
 * On booking completed: create a review invite (if eligible) and send the invite email.
 * Best-effort; callers should not fail the booking status update when this errors.
 */
export async function createReviewInviteIfEligible(
  supabase: SupabaseClient,
  booking: Pick<
    BookingRow,
    | 'id'
    | 'business_id'
    | 'customer_id'
    | 'customer_email'
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

  const recipient = normalizedCustomerRecipientEmail(
    booking.customer_email ?? ''
  );
  if (!recipient) {
    return { ok: true, skipped: true, reason: 'no_customer_email' };
  }

  if (!customerId) {
    return { ok: true, skipped: true, reason: 'no_customer_id' };
  }

  const existingInvite = await findInviteByBookingId(supabase, bookingId);
  if (existingInvite) {
    return { ok: true, skipped: true, reason: 'invite_already_exists' };
  }

  if (await hasExistingReviewForCustomer(supabase, businessId, customerId)) {
    return { ok: true, skipped: true, reason: 'customer_already_reviewed' };
  }

  if (await hasPendingInviteForCustomer(supabase, businessId, customerId)) {
    return { ok: true, skipped: true, reason: 'pending_invite_exists' };
  }

  const rawToken = crypto.randomBytes(32).toString('base64url');
  const linkTokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const businessName = await loadBusinessName(supabase, businessId);
  const publicReviewUrl = `${getAppBaseUrl()}${getPublicReviewPath(rawToken)}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: insertError } = await (supabase as any)
    .from('review_invites')
    .insert({
      business_id: businessId,
      booking_id: bookingId,
      customer_id: customerId,
      link_token_hash: linkTokenHash,
      status: 'pending',
      expires_at: expiresAtFromNow(),
    })
    .select('id')
    .single();

  if (insertError || !inserted?.id) {
    return {
      ok: false,
      error: insertError?.message ?? 'Failed to create review invite',
    };
  }

  const inviteId = inserted.id as string;
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

  const now = new Date().toISOString();

  if (emailResult.sent) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('review_invites')
      .update({
        email_sent_at: now,
        last_notification_error: null,
      })
      .eq('id', inviteId);

    return { ok: true, skipped: false, sent: true, inviteId };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('review_invites')
    .update({ last_notification_error: emailResult.error })
    .eq('id', inviteId);

  return {
    ok: true,
    skipped: false,
    sent: false,
    inviteId,
    emailErrorHint: emailResult.error,
  };
}
