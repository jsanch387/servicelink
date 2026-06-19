/**
 * `work_finished` booking action — owner Done / Skip while job is in progress.
 * See docs/contracts/mobile-booking-work-finished.md.
 */

import { buildWorkFinishedSms, sendAndRecordSms, toE164 } from '@/features/sms';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { assertOwnerSmsSendRateLimits } from '@/server/rateLimit/ownerSmsSendRateLimit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import {
  isWorkHandoffStatus,
  type WorkHandoffStatus,
} from '../workHandoffStatus';

export const WORK_FINISHED_ACTION = 'work_finished';

interface BookingForWorkFinished {
  id: string;
  business_id: string;
  status: string | null;
  job_status: string | null;
  work_handoff_status: string | null;
  customer_phone: string | null;
}

interface WorkFinishedAuth {
  user: { id: string };
  supabase: SupabaseClient;
}

function hasSendablePhone(phone: string | null | undefined): boolean {
  return toE164(phone?.trim() || '') !== null;
}

function smsOutcome(
  sendResult:
    | { sent: true; messageId: string | null }
    | { sent: false; reason: string }
) {
  if (sendResult.sent) {
    return {
      sent: true as const,
      messageId: sendResult.messageId,
      reason: null,
    };
  }
  return {
    sent: false as const,
    messageId: null,
    reason: sendResult.reason,
  };
}

export async function handleWorkFinishedAction(opts: {
  request: NextRequest;
  bookingId: string;
  notify: boolean;
  auth: WorkFinishedAuth;
  business: { id: string; business_name: string | null };
}): Promise<NextResponse> {
  const { request, bookingId, notify, auth, business } = opts;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bookingData, error: bookingError } = await (
    auth.supabase as any
  )
    .from('bookings')
    .select(
      'id, business_id, status, job_status, work_handoff_status, customer_phone'
    )
    .eq('id', bookingId)
    .maybeSingle();

  if (bookingError) {
    return NextResponse.json(
      { success: false, error: 'Could not load booking' },
      { status: 500 }
    );
  }

  const booking = bookingData as BookingForWorkFinished | null;

  if (!booking || booking.business_id !== business.id) {
    return NextResponse.json(
      { success: false, error: 'Booking not found' },
      { status: 404 }
    );
  }

  const jobStatus = (booking.job_status ?? '').trim();

  if ((booking.status ?? '').trim() !== 'confirmed') {
    return NextResponse.json(
      {
        success: false,
        error: 'Only confirmed appointments can be updated.',
      },
      { status: 409 }
    );
  }

  if (jobStatus !== 'in_progress') {
    return NextResponse.json(
      {
        success: false,
        error: 'Work can only be marked done while the job is in progress.',
        jobStatus: jobStatus || 'not_started',
      },
      { status: 409 }
    );
  }

  const existingHandoff = booking.work_handoff_status;
  if (isWorkHandoffStatus(existingHandoff)) {
    return NextResponse.json({
      success: true,
      action: WORK_FINISHED_ACTION,
      jobStatus: 'in_progress',
      workHandoffStatus: existingHandoff,
      sms: { sent: false, messageId: null, reason: 'duplicate' },
    });
  }

  if (notify && !hasSendablePhone(booking.customer_phone)) {
    return NextResponse.json(
      {
        success: false,
        error: 'No phone on file for this booking.',
      },
      { status: 409 }
    );
  }

  if (notify) {
    const rate = await assertOwnerSmsSendRateLimits(request, auth.user.id);
    if (!rate.ok) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
      );
    }
  }

  const nextHandoff: WorkHandoffStatus = notify ? 'notified' : 'skipped';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error: updateError } = await (auth.supabase as any)
    .from('bookings')
    .update({ work_handoff_status: nextHandoff })
    .eq('id', booking.id)
    .eq('status', 'confirmed')
    .eq('job_status', 'in_progress')
    .is('work_handoff_status', null)
    .select('work_handoff_status')
    .maybeSingle();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: 'Could not update booking.' },
      { status: 500 }
    );
  }

  if (!updated) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: latest } = await (auth.supabase as any)
      .from('bookings')
      .select('work_handoff_status')
      .eq('id', booking.id)
      .maybeSingle();

    const handoff = (latest as { work_handoff_status: string | null } | null)
      ?.work_handoff_status;

    if (isWorkHandoffStatus(handoff)) {
      return NextResponse.json({
        success: true,
        action: WORK_FINISHED_ACTION,
        jobStatus: 'in_progress',
        workHandoffStatus: handoff,
        sms: { sent: false, messageId: null, reason: 'duplicate' },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'This appointment was already updated.',
      },
      { status: 409 }
    );
  }

  if (!notify) {
    return NextResponse.json({
      success: true,
      action: WORK_FINISHED_ACTION,
      jobStatus: 'in_progress',
      workHandoffStatus: 'skipped',
      sms: { sent: false, messageId: null, reason: null },
    });
  }

  const admin = createSupabaseAdminClient();
  const businessName = business.business_name?.trim() || 'Your appointment';
  const sendResult = await sendAndRecordSms({
    admin,
    businessId: business.id,
    bookingId: booking.id,
    customerId: null,
    type: 'work_finished',
    to: booking.customer_phone,
    message: buildWorkFinishedSms({ businessName }),
    dedupeKey: `${booking.id}:work_finished`,
    recipientId: `booking:${booking.id}`,
    correlationId: booking.id,
  });

  return NextResponse.json({
    success: true,
    action: WORK_FINISHED_ACTION,
    jobStatus: 'in_progress',
    workHandoffStatus: 'notified',
    sms: smsOutcome(sendResult),
  });
}
