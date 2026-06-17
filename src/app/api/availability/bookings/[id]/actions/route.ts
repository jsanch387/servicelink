/**
 * POST /api/availability/bookings/[id]/actions
 *
 * Owner-only, data-driven booking actions. The body names an `action`
 * (e.g. `on_the_way`, `job_started`, `job_completed`); each action is defined in
 * the {@link BOOKING_ACTIONS} registry, which bundles the `job_status`
 * transition, the states it's valid from, and the customer SMS to send. Adding a
 * new action = a new registry entry (no new route).
 *
 * Semantics — state first, SMS second:
 *   1. The `job_status` transition is the authoritative outcome and is applied
 *      race-safely (`WHERE job_status IN (allowedFrom)`), which gives
 *      idempotency: a repeated/concurrent call that finds the booking already in
 *      the target (or an invalid) state returns `409` and sends no SMS.
 *   2. The customer SMS is a best-effort notification sent *after* the
 *      transition and logged to `sms_messages`. A failed/skipped send does NOT
 *      roll back the state — the job genuinely started/completed. The response
 *      reports the SMS outcome under `sms` so the app can surface a soft warning.
 *
 * Auth: `getAuthenticatedUser` (mobile Bearer token or web cookie). Bookings are
 * read/updated through the RLS-scoped session client; an explicit `business_id`
 * check adds defense-in-depth. Rate limited via `assertOwnerSmsSendRateLimits`
 * (SMS costs money).
 */

import {
  BOOKING_ACTION_TYPES,
  getBookingAction,
} from '@/features/availability/booking/server/bookingActionCatalog';
import {
  jobStatusLabel,
  type JobStatus,
} from '@/features/availability/booking/jobStatus';
import { completeBookingWithSideEffects } from '@/features/availability/services/completeBookingWithSideEffects';
import { sendAndRecordSms } from '@/features/sms';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { getReviewInviteRequestId } from '@/features/reviews/server/reviewInviteRouteLog';
import { assertOwnerSmsSendRateLimits } from '@/server/rateLimit/ownerSmsSendRateLimit';
import { NextRequest, NextResponse } from 'next/server';

interface BookingForAction {
  id: string;
  business_id: string;
  status: string | null;
  job_status: string | null;
  customer_phone: string | null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = id?.trim();
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID required' },
        { status: 400 }
      );
    }

    // 1. Parse + validate the requested action against the registry.
    const body = (await request.json().catch(() => ({}))) as {
      action?: unknown;
    };
    const requested = typeof body.action === 'string' ? body.action.trim() : '';
    const config = getBookingAction(requested);
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unknown or missing action.',
          validActions: BOOKING_ACTION_TYPES,
        },
        { status: 400 }
      );
    }

    // 2. Authenticate (Bearer for mobile, cookies for web).
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    // 3. Resolve the owner's business.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: businessData, error: businessError } = await (
      auth.supabase as any
    )
      .from('business_profiles')
      .select('id, business_name')
      .eq('profile_id', auth.user.id)
      .single();

    const business = businessData as {
      id: string;
      business_name: string | null;
    } | null;

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // 4. Load booking. RLS restricts SELECT to the owner's bookings; the
    // business_id check below is belt-and-suspenders.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bookingData, error: bookingError } = await (
      auth.supabase as any
    )
      .from('bookings')
      .select('id, business_id, status, job_status, customer_phone')
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingError) {
      return NextResponse.json(
        { success: false, error: 'Could not load booking' },
        { status: 500 }
      );
    }

    const booking = bookingData as BookingForAction | null;

    if (!booking || booking.business_id !== business.id) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // 4b. Idempotency for completing actions: if the booking is already
    // completed, return 200 with the current state instead of erroring — a
    // retry/double-tap should be a no-op, never a 409. No SMS/email is sent.
    if (
      config.completesBooking &&
      ((booking.job_status ?? '').trim() === 'completed' ||
        (booking.status ?? '').trim() === 'completed')
    ) {
      return NextResponse.json({
        success: true,
        action: config.type,
        jobStatus: 'completed',
        bookingStatus: 'completed',
        sms: { sent: false, messageId: null, reason: 'duplicate' },
        email: { sent: false, messageId: null, reason: null },
      });
    }

    // 5. Booking must be active (confirmed) to run job actions.
    if ((booking.status ?? '').trim() !== 'confirmed') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only confirmed appointments can be updated.',
        },
        { status: 409 }
      );
    }

    // 6. Validate the job_status transition.
    const current = (booking.job_status ?? 'not_started') as JobStatus;
    if (current === config.jobStatus) {
      return NextResponse.json(
        {
          success: false,
          error: `This appointment is already marked ${config.label}.`,
          jobStatus: current,
        },
        { status: 409 }
      );
    }
    if (!config.allowedFromJobStatus.includes(current)) {
      return NextResponse.json(
        {
          success: false,
          error: `Can't mark "${config.label}" — the job is currently ${jobStatusLabel(
            current
          )}.`,
          jobStatus: current,
        },
        { status: 409 }
      );
    }

    // 7. Rate limit before mutating (caps both SMS cost and action spam).
    const rate = await assertOwnerSmsSendRateLimits(request, auth.user.id);
    if (!rate.ok) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
      );
    }

    // 8. Apply the transition race-safely. The `IN (allowedFrom)` guard means a
    // concurrent request that already moved the booking yields 0 rows here →
    // we treat it as "already changed" and send no SMS.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (auth.supabase as any)
      .from('bookings')
      .update({ job_status: config.jobStatus })
      .eq('id', booking.id)
      .eq('status', 'confirmed')
      .in('job_status', config.allowedFromJobStatus)
      .select('job_status')
      .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Could not update booking.' },
        { status: 500 }
      );
    }

    if (!updated) {
      // Lost the race / already transitioned by another request.
      return NextResponse.json(
        {
          success: false,
          error: `This appointment was already updated.`,
        },
        { status: 409 }
      );
    }

    const newJobStatus = (updated as { job_status: string }).job_status;
    const admin = createSupabaseAdminClient();

    // 9. Completing actions (`job_completed`) take the shared completion path:
    // it sets `status = 'completed'`, runs maintenance, and sends the SINGLE
    // customer completion notification (review-link SMS first, email fallback,
    // or a plain thank-you SMS when the customer already reviewed). For these we
    // must NOT also send the generic action SMS below — that would double-text.
    if (config.completesBooking) {
      const completed = await completeBookingWithSideEffects(
        auth.supabase,
        admin,
        booking.id,
        { requestId: getReviewInviteRequestId(request), source: 'mobile_api' }
      );

      // Always return both `sms` and `email` blocks so the app can pick the
      // right toast. SMS-first, email fallback — only one is ever `sent: true`.
      const notification = completed?.notification;
      const sms = notification?.sms ?? {
        sent: false,
        messageId: null,
        reason: 'error',
      };
      const email = notification?.email ?? {
        sent: false,
        messageId: null,
        reason: null,
      };

      return NextResponse.json({
        success: true,
        action: config.type,
        jobStatus: newJobStatus,
        ...(completed?.booking.status
          ? { bookingStatus: completed.booking.status }
          : {}),
        sms,
        email,
      });
    }

    // 10. Non-completing actions: best-effort customer notification (state
    // already changed above).
    const businessName = business.business_name?.trim() || 'Your appointment';
    const sendResult = await sendAndRecordSms({
      admin,
      businessId: business.id,
      bookingId: booking.id,
      customerId: null,
      type: config.smsType,
      to: booking.customer_phone,
      message: config.buildMessage({ businessName }),
      dedupeKey: config.oncePerBooking
        ? `${booking.id}:${config.smsType}`
        : null,
      recipientId: `booking:${booking.id}`,
      correlationId: booking.id,
    });

    const sms = sendResult.sent
      ? { sent: true as const, messageId: sendResult.messageId }
      : { sent: false as const, reason: sendResult.reason };

    return NextResponse.json({
      success: true,
      action: config.type,
      jobStatus: newJobStatus,
      sms,
    });
  } catch (err) {
    console.error('[API] POST /api/availability/bookings/[id]/actions:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to run booking action' },
      { status: 500 }
    );
  }
}
