/**
 * `job_completed` booking action — Complete sheet / payment close-out.
 * See docs/sql/booking_complete_phase1_migration.sql and
 * docs/contracts/mobile-booking-job-completed.md.
 */

import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { getReviewInviteRequestId } from '@/features/reviews/server/reviewInviteRouteLog';
import { assertOwnerSmsSendRateLimits } from '@/server/rateLimit/ownerSmsSendRateLimit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { computeBookingAmountDue } from './computeBookingAmountDue';
import {
  JOB_COMPLETED_ACTION,
  type JobCompletedSuccessResponse,
} from './jobCompletedTypes';
import {
  buildJobCompletedTrace,
  logJobCompletedFinished,
  logJobCompletedStage,
} from './jobCompletedRouteLog';
import { parseJobCompletedBody } from './parseJobCompletedBody';
import { persistJobCompletedTransaction } from './persistJobCompletedTransaction';
import {
  isWorkHandoffStatus,
  type WorkHandoffStatus,
} from '../workHandoffStatus';

interface BookingForJobCompleted {
  id: string;
  business_id: string;
  status: string | null;
  job_status: string | null;
  work_handoff_status: string | null;
  service_price_cents: number | null;
  addon_details: unknown;
}

interface BookingPaymentsRow {
  paid_online_amount_cents: number | null;
}

interface JobCompletedAuth {
  user: { id: string };
  supabase: SupabaseClient;
}

function idempotentSuccess(
  workHandoffStatus: WorkHandoffStatus | null,
  invoicePublicToken: string | null
): NextResponse {
  const payload: JobCompletedSuccessResponse = {
    success: true,
    action: JOB_COMPLETED_ACTION,
    jobStatus: 'completed',
    bookingStatus: 'completed',
    workHandoffStatus: workHandoffStatus ?? 'skipped',
    invoicePublicToken,
    sms: { sent: false, messageId: null, reason: 'duplicate' },
    email: { sent: false, messageId: null, reason: null },
  };
  return NextResponse.json(payload);
}

async function loadInvoiceTokenForCompletedBooking(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  bookingId: string
): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('booking_invoices')
    .select('public_token')
    .eq('booking_id', bookingId)
    .maybeSingle();
  const token = (data as { public_token?: string } | null)?.public_token;
  return typeof token === 'string' && token.trim() ? token.trim() : null;
}

export async function handleJobCompletedAction(opts: {
  request: NextRequest;
  bookingId: string;
  rawBody: unknown;
  auth: JobCompletedAuth;
  business: { id: string; business_name: string | null };
}): Promise<NextResponse> {
  const { request, bookingId, rawBody, auth, business } = opts;
  const requestId = getReviewInviteRequestId(request);

  const parsed = parseJobCompletedBody(rawBody);
  const trace = buildJobCompletedTrace({
    requestId,
    bookingId,
    businessId: business.id,
  });

  logJobCompletedStage(trace, 'received', {
    businessName: business.business_name,
    sessionFeeCount: parsed.ok ? (parsed.body.sessionFees?.length ?? 0) : 0,
    sessionPaymentMethod: parsed.ok
      ? (parsed.body.sessionPayment?.method ?? null)
      : null,
    sessionPaymentCents: parsed.ok
      ? (parsed.body.sessionPayment?.amountCents ?? null)
      : null,
  });

  if (!parsed.ok) {
    logJobCompletedStage(trace, 'rejected', {
      httpStatus: 400,
      reason: parsed.error,
    });
    return NextResponse.json(
      { success: false, error: parsed.error },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bookingData, error: bookingError } = await (
    auth.supabase as any
  )
    .from('bookings')
    .select(
      'id, business_id, status, job_status, work_handoff_status, service_price_cents, addon_details'
    )
    .eq('id', bookingId)
    .maybeSingle();

  if (bookingError) {
    logJobCompletedStage(trace, 'rejected', {
      httpStatus: 500,
      reason: 'Could not load booking',
    });
    return NextResponse.json(
      { success: false, error: 'Could not load booking' },
      { status: 500 }
    );
  }

  const booking = bookingData as BookingForJobCompleted | null;

  if (!booking || booking.business_id !== business.id) {
    logJobCompletedStage(trace, 'rejected', {
      httpStatus: 404,
      reason: 'Booking not found',
    });
    return NextResponse.json(
      { success: false, error: 'Booking not found' },
      { status: 404 }
    );
  }

  logJobCompletedStage(trace, 'validated', {
    bookingStatus: booking.status,
    jobStatus: booking.job_status,
    workHandoffStatus: booking.work_handoff_status,
  });

  const jobStatus = (booking.job_status ?? '').trim();
  const bookingStatus = (booking.status ?? '').trim();
  const handoff = booking.work_handoff_status;

  if (
    jobStatus === 'completed' ||
    bookingStatus === 'completed'
  ) {
    const admin = createSupabaseAdminClient();
    const invoicePublicToken = await loadInvoiceTokenForCompletedBooking(
      admin,
      bookingId
    );
    logJobCompletedFinished(trace, {
      duplicate: true,
      invoicePublicToken,
      smsSent: false,
      smsReason: 'duplicate',
      emailSent: false,
      emailReason: null,
      workHandoffStatus: isWorkHandoffStatus(handoff) ? handoff : undefined,
    });
    return idempotentSuccess(
      isWorkHandoffStatus(handoff) ? handoff : null,
      invoicePublicToken
    );
  }

  if (bookingStatus !== 'confirmed') {
    logJobCompletedStage(trace, 'rejected', {
      httpStatus: 409,
      reason: 'Only confirmed appointments can be updated.',
      bookingStatus,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Only confirmed appointments can be updated.',
      },
      { status: 409 }
    );
  }

  if (jobStatus !== 'in_progress') {
    logJobCompletedStage(trace, 'rejected', {
      httpStatus: 409,
      reason: 'Job is not in progress',
      jobStatus: jobStatus || 'not_started',
    });
    return NextResponse.json(
      {
        success: false,
        error: "Can't mark completed — the job is not in progress.",
        jobStatus: jobStatus || 'not_started',
      },
      { status: 409 }
    );
  }

  if (!isWorkHandoffStatus(handoff)) {
    logJobCompletedStage(trace, 'rejected', {
      httpStatus: 409,
      reason: 'work_handoff_status required (Done/Skip first)',
      workHandoffStatus: handoff,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Mark work done or skip before completing this booking.',
      },
      { status: 409 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: paymentsData } = await (auth.supabase as any)
    .from('booking_payments')
    .select('paid_online_amount_cents')
    .eq('booking_id', bookingId)
    .maybeSingle();

  const payments = paymentsData as BookingPaymentsRow | null;
  const amountDue = computeBookingAmountDue({
    servicePriceCents: booking.service_price_cents,
    addonDetails: booking.addon_details,
    sessionFees: parsed.body.sessionFees ?? [],
    paidOnlineAmountCents: payments?.paid_online_amount_cents,
    sessionPayment: parsed.body.sessionPayment,
  });

  logJobCompletedStage(trace, 'amount_due', {
    serviceCents: amountDue.serviceCents,
    addonCents: amountDue.addonCents,
    sessionFeeCents: amountDue.sessionFeeCents,
    subtotalCents: amountDue.subtotalCents,
    paidOnlineCents: amountDue.paidOnlineCents,
    sessionPayCents: amountDue.sessionPayCents,
    amountDueCents: amountDue.amountDueCents,
  });

  if (amountDue.amountDueCents > 0) {
    logJobCompletedStage(trace, 'rejected', {
      httpStatus: 400,
      reason: 'Payment is still due on this booking.',
      amountDueCents: amountDue.amountDueCents,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Payment is still due on this booking.',
      },
      { status: 400 }
    );
  }

  if (
    parsed.body.sessionPayment?.method === 'tap_to_pay' &&
    !parsed.body.sessionPayment.stripePaymentIntentId
  ) {
    logJobCompletedStage(trace, 'rejected', {
      httpStatus: 400,
      reason: 'Tap to Pay requires stripePaymentIntentId (Phase 2)',
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Tap to Pay requires stripePaymentIntentId (Phase 2).',
      },
      { status: 400 }
    );
  }

  const rate = await assertOwnerSmsSendRateLimits(request, auth.user.id);
  if (!rate.ok) {
    logJobCompletedStage(trace, 'rejected', {
      httpStatus: 429,
      reason: 'rate_limited',
      retryAfterSec: rate.retryAfterSec,
    });
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
    );
  }

  const admin = createSupabaseAdminClient();
  const persisted = await persistJobCompletedTransaction({
    sessionClient: auth.supabase,
    admin,
    bookingId: booking.id,
    businessId: business.id,
    workHandoffStatus: handoff,
    body: parsed.body,
    amountDue,
    requestId,
  });

  if (!persisted.ok) {
    logJobCompletedStage(trace, 'rejected', {
      httpStatus: persisted.httpStatus,
      reason: persisted.error,
    });
    return NextResponse.json(
      { success: false, error: persisted.error },
      { status: persisted.httpStatus }
    );
  }

  const payload: JobCompletedSuccessResponse = {
    success: true,
    action: JOB_COMPLETED_ACTION,
    ...persisted.response,
  };

  logJobCompletedFinished(trace, {
    duplicate: persisted.response.sms.reason === 'duplicate',
    invoicePublicToken: persisted.response.invoicePublicToken,
    smsSent: persisted.response.sms.sent,
    smsReason: persisted.response.sms.reason,
    emailSent: persisted.response.email.sent,
    emailReason: persisted.response.email.reason,
    workHandoffStatus: persisted.response.workHandoffStatus,
  });

  return NextResponse.json(payload);
}
