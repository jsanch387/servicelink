/**
 * Phase 1 persistence for `job_completed` — writes fee lines, payment summary,
 * booking completion, and invoice row before customer notification.
 */

import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import { ensureReviewInviteRecordIfEligible } from '@/features/reviews/server/ensureReviewInviteRecordIfEligible';
import { applyMaintenanceVisitCompletedFromBooking } from '@/features/maintenance/server/applyMaintenanceVisitCompletedFromBooking';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildInvoiceSnapshot,
  type BookingInvoiceSnapshot,
} from './buildInvoiceSnapshot';
import {
  computeBookingRemainingAmountCents,
  type BookingAmountDueResult,
} from './computeBookingAmountDue';
import { generateInvoicePublicToken } from './generateInvoicePublicToken';
import type {
  JobCompletedRequestBody,
  JobCompletedSuccessResponse,
} from './jobCompletedTypes';
import {
  buildJobCompletedTrace,
  logJobCompletedStage,
} from './jobCompletedRouteLog';
import { sendJobCompletedCustomerNotification } from './sendJobCompletedCustomerNotification';
import { loadBusinessProfileForInvoice } from './loadBusinessProfileForInvoice';
import { markTapToPayIntentJobCompleted } from './verifyTapToPayPaymentIntent';
import type { WorkHandoffStatus } from '../workHandoffStatus';

const SESSION_FEE_SOURCE = 'owner_complete_screen';

interface BookingPaymentsRow {
  id?: string;
  currency?: string | null;
  paid_online_amount_cents?: number | null;
}

export interface PersistJobCompletedInput {
  sessionClient: SupabaseClient<Database>;
  admin: SupabaseClient<Database>;
  bookingId: string;
  businessId: string;
  workHandoffStatus: WorkHandoffStatus;
  body: JobCompletedRequestBody;
  amountDue: BookingAmountDueResult;
  requestId: string;
}

export type PersistJobCompletedResult =
  | {
      ok: true;
      response: Pick<
        JobCompletedSuccessResponse,
        | 'jobStatus'
        | 'bookingStatus'
        | 'workHandoffStatus'
        | 'invoicePublicToken'
        | 'sms'
        | 'email'
      >;
    }
  | { ok: false; error: string; httpStatus: number };

async function loadExistingInvoiceToken(
  admin: SupabaseClient<Database>,
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

async function loadBookingForPersist(
  sessionClient: SupabaseClient<Database>,
  bookingId: string
): Promise<BookingRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sessionClient as any)
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();

  if (error || !data) return null;
  return data as BookingRow;
}

async function loadBookingPayments(
  admin: SupabaseClient<Database>,
  bookingId: string
): Promise<BookingPaymentsRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('booking_payments')
    .select('id, currency, paid_online_amount_cents')
    .eq('booking_id', bookingId)
    .maybeSingle();

  return (data as BookingPaymentsRow | null) ?? null;
}

async function replaceSessionFeeLines(
  admin: SupabaseClient<Database>,
  bookingId: string,
  businessId: string,
  sessionFees: JobCompletedRequestBody['sessionFees']
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('booking_session_fee_lines')
    .delete()
    .eq('booking_id', bookingId);

  if (!sessionFees?.length) return;

  const rows = sessionFees.map((fee, index) => ({
    booking_id: bookingId,
    business_id: businessId,
    label: fee.label,
    amount_cents: fee.amountCents,
    source: SESSION_FEE_SOURCE,
    sort_order: index,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('booking_session_fee_lines')
    .insert(rows);

  if (error) throw error;
}

async function upsertBookingPaymentsForCompletion(
  admin: SupabaseClient<Database>,
  args: {
    bookingId: string;
    businessId: string;
    amountDue: BookingAmountDueResult;
    sessionPayment: JobCompletedRequestBody['sessionPayment'];
    existing: BookingPaymentsRow | null;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const sessionFeesTotal = args.amountDue.sessionFeeCents;
  const totalAmountCents = args.amountDue.subtotalCents;
  const paidOnline = args.amountDue.paidOnlineCents;
  const sessionPay = args.amountDue.sessionPayCents;
  const remainingAmountCents = computeBookingRemainingAmountCents({
    totalAmountCents,
    paidOnlineCents: paidOnline,
    sessionPayCents: sessionPay,
  });

  const patch: Record<string, unknown> = {
    session_fees_total_cents: sessionFeesTotal,
    total_amount_cents: totalAmountCents,
    remaining_amount_cents: remainingAmountCents,
    payment_status: 'paid_full',
    updated_at: now,
  };

  if (args.sessionPayment) {
    patch.session_payment_method = args.sessionPayment.method;
    patch.session_payment_amount_cents = args.sessionPayment.amountCents;
    patch.session_payment_recorded_at = now;
    if (args.sessionPayment.stripePaymentIntentId) {
      patch.session_payment_stripe_payment_intent_id =
        args.sessionPayment.stripePaymentIntentId;
    }
    if (args.sessionPayment.method === 'tap_to_pay') {
      patch.provider = 'stripe';
    }
  }

  if (args.existing?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('booking_payments')
      .update(patch)
      .eq('id', args.existing.id);

    if (error) throw error;
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from('booking_payments').insert({
    booking_id: args.bookingId,
    business_id: args.businessId,
    provider: args.sessionPayment?.method === 'tap_to_pay' ? 'stripe' : 'none',
    payment_method_selected: args.sessionPayment ? 'pay_in_person' : 'none',
    currency: args.existing?.currency?.trim()?.toLowerCase() || 'usd',
    required_online_amount_cents: 0,
    paid_online_amount_cents: paidOnline,
    deposit_type: null,
    deposit_value: null,
    last_checkout_session_id: null,
    paid_at: paidOnline > 0 ? now : null,
    ...patch,
  });

  if (error) throw error;
}

async function markBookingCompleted(
  sessionClient: SupabaseClient<Database>,
  bookingId: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sessionClient as any)
    .from('bookings')
    .update({ job_status: 'completed', status: 'completed' })
    .eq('id', bookingId)
    .eq('status', 'confirmed')
    .neq('job_status', 'completed')
    .select('id')
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
}

async function insertBookingInvoice(
  admin: SupabaseClient<Database>,
  args: {
    bookingId: string;
    businessId: string;
    publicToken: string;
    snapshot: BookingInvoiceSnapshot;
    amountDue: BookingAmountDueResult;
  }
): Promise<void> {
  const paidCents =
    args.amountDue.paidOnlineCents + args.amountDue.sessionPayCents;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from('booking_invoices').insert({
    booking_id: args.bookingId,
    business_id: args.businessId,
    public_token: args.publicToken,
    snapshot_json: args.snapshot,
    subtotal_cents: args.amountDue.subtotalCents,
    total_cents: args.amountDue.subtotalCents,
    paid_cents: paidCents,
    status: 'paid',
  });

  if (error) throw error;
}

export async function persistJobCompletedTransaction(
  input: PersistJobCompletedInput
): Promise<PersistJobCompletedResult> {
  const {
    sessionClient,
    admin,
    bookingId,
    businessId,
    workHandoffStatus,
    body,
    amountDue,
  } = input;

  const trace = buildJobCompletedTrace({
    requestId: input.requestId,
    bookingId,
    businessId,
  });

  const existingToken = await loadExistingInvoiceToken(admin, bookingId);
  if (existingToken) {
    return {
      ok: true,
      response: {
        jobStatus: 'completed',
        bookingStatus: 'completed',
        workHandoffStatus,
        invoicePublicToken: existingToken,
        sms: { sent: false, messageId: null, reason: 'duplicate' },
        email: { sent: false, messageId: null, reason: null },
      },
    };
  }

  const booking = await loadBookingForPersist(sessionClient, bookingId);
  if (!booking) {
    return { ok: false, error: 'Booking not found', httpStatus: 404 };
  }

  const [business, payments] = await Promise.all([
    loadBusinessProfileForInvoice(admin, businessId),
    loadBookingPayments(admin, bookingId),
  ]);

  const reviewInvite = await ensureReviewInviteRecordIfEligible(admin, booking);
  const includeReviewHint =
    reviewInvite.ok &&
    !reviewInvite.skipped &&
    'rawReviewToken' in reviewInvite;

  const reviewRawToken =
    reviewInvite.ok && !reviewInvite.skipped && 'rawReviewToken' in reviewInvite
      ? reviewInvite.rawReviewToken
      : null;

  const snapshot = buildInvoiceSnapshot({
    business: {
      id: businessId,
      name: business.name,
      businessSlug: business.businessSlug,
      businessLink: business.businessLink,
    },
    booking,
    sessionFees: body.sessionFees ?? [],
    amountDue,
    sessionPaymentMethod: body.sessionPayment?.method,
    reviewRawToken,
  });

  const publicToken = generateInvoicePublicToken();

  try {
    await replaceSessionFeeLines(
      admin,
      bookingId,
      businessId,
      body.sessionFees ?? []
    );

    await upsertBookingPaymentsForCompletion(admin, {
      bookingId,
      businessId,
      amountDue,
      sessionPayment: body.sessionPayment,
      existing: payments,
    });
    if (
      body.sessionPayment?.method === 'tap_to_pay' &&
      body.sessionPayment.stripePaymentIntentId
    ) {
      await markTapToPayIntentJobCompleted({
        paymentIntentId: body.sessionPayment.stripePaymentIntentId,
      });
    }

    await insertBookingInvoice(admin, {
      bookingId,
      businessId,
      publicToken,
      snapshot,
      amountDue,
    });

    const transitioned = await markBookingCompleted(sessionClient, bookingId);
    if (!transitioned) {
      const tokenAfterRace = await loadExistingInvoiceToken(admin, bookingId);
      if (tokenAfterRace) {
        return {
          ok: true,
          response: {
            jobStatus: 'completed',
            bookingStatus: 'completed',
            workHandoffStatus,
            invoicePublicToken: tokenAfterRace,
            sms: { sent: false, messageId: null, reason: 'duplicate' },
            email: { sent: false, messageId: null, reason: null },
          },
        };
      }
      return {
        ok: false,
        error: 'This appointment was already updated.',
        httpStatus: 409,
      };
    }
  } catch (err) {
    logJobCompletedStage(trace, 'rejected', {
      httpStatus: 500,
      reason: 'persist_failed',
      error: err instanceof Error ? err.message : String(err),
    });
    console.error('[job_completed] persist failed', {
      bookingId,
      requestId: input.requestId,
      err:
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : String(err),
      details:
        typeof err === 'object' && err !== null && 'details' in err
          ? (err as { details: unknown }).details
          : undefined,
    });
    return {
      ok: false,
      error: 'Could not complete booking checkout.',
      httpStatus: 500,
    };
  }

  try {
    await applyMaintenanceVisitCompletedFromBooking(admin, {
      id: booking.id,
      business_id: booking.business_id,
      customer_id: booking.customer_id,
    });
  } catch (sideErr) {
    console.error('[job_completed] maintenance side effect', sideErr);
  }

  const notification = await sendJobCompletedCustomerNotification({
    admin,
    businessId,
    bookingId: booking.id,
    customerId: booking.customer_id,
    customerPhone: booking.customer_phone,
    customerEmail: booking.customer_email,
    customerName: booking.customer_name,
    businessName: business.name,
    invoicePublicToken: publicToken,
    includeReviewHint,
    requestId: input.requestId,
  });

  return {
    ok: true,
    response: {
      jobStatus: 'completed',
      bookingStatus: 'completed',
      workHandoffStatus,
      invoicePublicToken: publicToken,
      sms: notification.sms,
      email: notification.email,
    },
  };
}
