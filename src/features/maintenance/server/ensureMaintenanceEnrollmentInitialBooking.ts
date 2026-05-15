/**
 * When a maintenance enrollment is accepted (card or pay-in-person), create one
 * `bookings` row for the first visit so it appears on the owner calendar.
 * Idempotent via `maintenance_enrollments.initial_booking_id`.
 */

import { createBookingForExistingCustomer } from '@/features/availability/services/bookingService';
import { enforceFreeTierBookingCapBeforeCreate } from '@/features/availability/services/enforceFreeTierBookingCapBeforeCreate';
import { checkMaintenanceAnchorAgainstCalendar } from '@/features/maintenance/server/checkMaintenanceAnchorAgainstCalendar';
import { notifyOwnerForMaintenanceInitialBooking } from '@/features/maintenance/server/notifyOwnerForMaintenanceInitialBooking';
import { maintenanceCalendarBookingServiceTitle } from '@/features/maintenance/utils/maintenanceDetailServiceLabel';
import { quoteStartTimeToHHmm } from '@/features/quotes/server/createBookingFromApprovedQuote';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hasMaintenanceAnchorScheduled } from './hasMaintenanceAnchorScheduled';
import { maintenanceEnrollmentPaidWithCard } from './maintenanceEnrollmentPaymentStatus';

export type EnsureMaintenanceBookingResult = {
  bookingId: string | null;
  created: boolean;
  /** Set when no row was inserted (includes calendar conflicts). */
  skippedReason?:
    | 'load_failed'
    | 'not_found'
    | 'not_accepted'
    | 'no_anchor'
    | 'business_not_found'
    | 'time_off_conflict'
    | 'existing_booking_conflict'
    | 'load_bookings_failed'
    | 'insert_failed'
    | 'payment_row_failed'
    | 'link_failed'
    | 'race_lost'
    | 'free_tier_cap';
};

/**
 * @param stripeCheckoutSessionId — when payment was via Stripe Checkout (card), for `booking_payments.last_checkout_session_id`.
 */
export async function ensureMaintenanceEnrollmentInitialBooking(
  supabase: SupabaseClient<Database>,
  enrollmentId: string,
  options?: { stripeCheckoutSessionId?: string | null }
): Promise<EnsureMaintenanceBookingResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: row, error: loadErr } = await db
    .from('maintenance_enrollments')
    .select(
      'id, business_id, customer_id, status, initial_booking_id, service_name_snapshot, price_cents, duration_minutes, frequency_weeks, anchor_date, anchor_time, payment_status, customer_selected_payment'
    )
    .eq('id', enrollmentId)
    .maybeSingle();

  if (loadErr) {
    console.error(
      '[maintenance] ensure booking: load enrollment',
      loadErr,
      enrollmentId
    );
    return {
      bookingId: null,
      created: false,
      skippedReason: 'load_failed',
    };
  }

  const enrollment = row as {
    id: string;
    business_id: string;
    customer_id: string;
    status: string;
    initial_booking_id: string | null;
    service_name_snapshot: string;
    price_cents: number | null;
    duration_minutes: number | null;
    frequency_weeks: number | null;
    anchor_date: string | null;
    anchor_time: string | null;
    payment_status: string;
    customer_selected_payment: string | null;
  } | null;

  if (!enrollment) {
    return { bookingId: null, created: false, skippedReason: 'not_found' };
  }

  if (enrollment.status !== 'accepted') {
    return {
      bookingId: null,
      created: false,
      skippedReason: 'not_accepted',
    };
  }

  const existingId = enrollment.initial_booking_id?.trim();
  if (existingId) {
    return { bookingId: existingId, created: false };
  }

  if (!hasMaintenanceAnchorScheduled(enrollment)) {
    console.error(
      '[maintenance] ensure booking: missing anchor despite accepted status',
      { enrollmentId }
    );
    return {
      bookingId: null,
      created: false,
      skippedReason: 'no_anchor',
    };
  }

  const scheduledDate = String(enrollment.anchor_date ?? '').trim();
  const startTime = quoteStartTimeToHHmm(String(enrollment.anchor_time ?? ''));
  const durationMinutes = Math.max(
    1,
    Math.round(Number(enrollment.duration_minutes ?? 60))
  );
  const priceCents = Math.max(
    0,
    Math.round(Number(enrollment.price_cents ?? 0))
  );

  const serviceName = maintenanceCalendarBookingServiceTitle(
    enrollment.service_name_snapshot
  );
  const freq = Math.max(1, Math.round(Number(enrollment.frequency_weeks ?? 1)));
  const bookingCustomerNotes = `Maintenance detail (first visit). Repeats every ${freq} week(s).`;

  const slotCheck = await checkMaintenanceAnchorAgainstCalendar(supabase, {
    businessId: enrollment.business_id,
    anchorDate: scheduledDate,
    anchorTime: String(enrollment.anchor_time ?? ''),
    durationMinutes,
  });
  if (!slotCheck.ok) {
    console.warn('[maintenance] ensure booking: calendar conflict', {
      enrollmentId,
      reason: slotCheck.reason,
      scheduledDate,
      startTime,
    });
    return {
      bookingId: null,
      created: false,
      skippedReason: slotCheck.reason,
    };
  }

  const { data: businessRow, error: bizErr } = await supabase
    .from('business_profiles')
    .select(
      'business_slug, profile_id, free_bookings_month, free_bookings_count'
    )
    .eq('id', enrollment.business_id)
    .maybeSingle();

  if (bizErr || !businessRow) {
    console.error('[maintenance] ensure booking: business', bizErr, {
      enrollmentId,
    });
    return {
      bookingId: null,
      created: false,
      skippedReason: 'business_not_found',
    };
  }

  const biz = businessRow as {
    business_slug?: string | null;
    profile_id?: string | null;
    free_bookings_month?: string | null;
    free_bookings_count?: number | null;
  };

  const freeTierCap = await enforceFreeTierBookingCapBeforeCreate(supabase, {
    id: enrollment.business_id,
    profile_id: biz.profile_id ?? null,
    free_bookings_month: biz.free_bookings_month ?? null,
    free_bookings_count: biz.free_bookings_count ?? null,
  });
  if (!freeTierCap.ok) {
    console.warn('[maintenance] ensure booking: free tier cap', {
      enrollmentId,
      businessId: enrollment.business_id,
    });
    return {
      bookingId: null,
      created: false,
      skippedReason: 'free_tier_cap',
    };
  }

  const businessSlug = (biz.business_slug ?? '').trim();

  let bookingId: string;
  try {
    const out = await createBookingForExistingCustomer(supabase, {
      businessId: enrollment.business_id,
      businessSlug: businessSlug || 'business',
      customerId: enrollment.customer_id,
      serviceName,
      servicePriceCents: priceCents,
      durationMinutes,
      scheduledDate,
      startTime,
      bookingCustomerNotes,
    });
    bookingId = out.id;
  } catch (e) {
    console.error('[maintenance] ensure booking: create failed', e, {
      enrollmentId,
    });
    return {
      bookingId: null,
      created: false,
      skippedReason: 'insert_failed',
    };
  }

  const paidCard = maintenanceEnrollmentPaidWithCard(enrollment.payment_status);
  const stripeSession = options?.stripeCheckoutSessionId?.trim() || null;

  try {
    if (paidCard) {
      await db.from('booking_payments').insert({
        booking_id: bookingId,
        business_id: enrollment.business_id,
        provider: 'stripe',
        payment_status: 'paid_full',
        payment_method_selected: 'pay_now',
        currency: 'usd',
        total_amount_cents: priceCents,
        required_online_amount_cents: priceCents,
        paid_online_amount_cents: priceCents,
        remaining_amount_cents: 0,
        last_checkout_session_id: stripeSession,
        paid_at: new Date().toISOString(),
      });
    } else {
      await db.from('booking_payments').insert({
        booking_id: bookingId,
        business_id: enrollment.business_id,
        provider: 'none',
        payment_status: priceCents > 0 ? 'awaiting_payment' : 'not_required',
        payment_method_selected: 'pay_in_person',
        currency: 'usd',
        total_amount_cents: priceCents,
        required_online_amount_cents: 0,
        paid_online_amount_cents: 0,
        remaining_amount_cents: priceCents,
      });
    }
  } catch (payErr) {
    console.error('[maintenance] ensure booking: booking_payments', payErr, {
      enrollmentId,
      bookingId,
    });
    await db.from('bookings').delete().eq('id', bookingId);
    return {
      bookingId: null,
      created: false,
      skippedReason: 'payment_row_failed',
    };
  }

  const { data: linked, error: linkErr } = await db
    .from('maintenance_enrollments')
    .update({ initial_booking_id: bookingId })
    .eq('id', enrollmentId)
    .is('initial_booking_id', null)
    .select('initial_booking_id')
    .maybeSingle();

  if (linkErr) {
    console.error('[maintenance] ensure booking: link enrollment', linkErr, {
      enrollmentId,
      bookingId,
    });
    await db.from('bookings').delete().eq('id', bookingId);
    return {
      bookingId: null,
      created: false,
      skippedReason: 'link_failed',
    };
  }

  if (!linked) {
    await db.from('bookings').delete().eq('id', bookingId);
    const { data: other } = await db
      .from('maintenance_enrollments')
      .select('initial_booking_id')
      .eq('id', enrollmentId)
      .maybeSingle();
    const winner = (
      other as { initial_booking_id?: string | null } | null
    )?.initial_booking_id?.trim();
    return {
      bookingId: winner ?? null,
      created: false,
      skippedReason: 'race_lost',
    };
  }

  try {
    await notifyOwnerForMaintenanceInitialBooking(supabase, {
      businessId: enrollment.business_id,
      bookingId,
      serviceName,
      scheduledDate,
      startTime,
      durationMinutes,
      priceCents,
      paidWithCard: paidCard,
    });
  } catch (notifyErr) {
    console.error('[maintenance] ensure booking: owner notify', notifyErr, {
      enrollmentId,
      bookingId,
    });
  }

  return { bookingId, created: true };
}
