import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createReviewInviteIfEligible,
  type CreateReviewInviteResult,
} from './createReviewInviteIfEligible';

const BOOKING_SELECT =
  'id, business_id, customer_id, customer_email, customer_name, service_name, scheduled_date, start_time, status';

export type ReviewInviteSkipReason =
  | 'no_customer_email'
  | 'no_customer_id'
  | 'invite_already_exists'
  | 'customer_already_reviewed'
  | 'pending_invite_exists';

export type RequestReviewInviteForBookingResult =
  | {
      ok: true;
      sent: boolean;
      skipped: false;
      inviteId: string;
      emailErrorHint?: string;
    }
  | {
      ok: true;
      sent: false;
      skipped: true;
      reason: ReviewInviteSkipReason;
    }
  | { ok: false; status: number; error: string };

function mapCreateResult(
  result: CreateReviewInviteResult
): RequestReviewInviteForBookingResult {
  if (!result.ok) {
    return { ok: false, status: 500, error: result.error };
  }
  if ('skipped' in result && result.skipped) {
    return {
      ok: true,
      sent: false,
      skipped: true,
      reason: result.reason as ReviewInviteSkipReason,
    };
  }
  return {
    ok: true,
    sent: result.sent,
    skipped: false,
    inviteId: result.inviteId,
    ...(result.emailErrorHint ? { emailErrorHint: result.emailErrorHint } : {}),
  };
}

/**
 * Owner-authenticated: load booking (RLS), then create invite + send email (admin).
 * Call after marking the booking completed (mobile or web).
 */
export async function requestReviewInviteForBooking(
  ownerSupabase: SupabaseClient,
  businessId: string,
  bookingId: string
): Promise<RequestReviewInviteForBookingResult> {
  const trimmedBusinessId = businessId?.trim();
  const trimmedBookingId = bookingId?.trim();

  if (!trimmedBusinessId || !trimmedBookingId) {
    return {
      ok: false,
      status: 400,
      error: 'businessId and bookingId are required',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (ownerSupabase as any)
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('id', trimmedBookingId)
    .eq('business_id', trimmedBusinessId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      status: 500,
      error: error.message || 'Failed to load booking',
    };
  }

  if (!data) {
    return { ok: false, status: 404, error: 'Booking not found' };
  }

  const booking = data as Pick<
    BookingRow,
    | 'id'
    | 'business_id'
    | 'customer_id'
    | 'customer_email'
    | 'customer_name'
    | 'service_name'
    | 'scheduled_date'
    | 'start_time'
    | 'status'
  >;

  if (booking.status !== 'completed') {
    return {
      ok: false,
      status: 400,
      error: 'Booking must be completed before sending a review invite',
    };
  }

  const admin = createSupabaseAdminClient();
  return mapCreateResult(
    await createReviewInviteIfEligible(admin, booking as BookingRow)
  );
}
