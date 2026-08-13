/**
 * Public member books the visit for the current Stripe billing period.
 * Verifies manage/visit token, creates a $0 covered booking, links period_visit_*.
 */

import { createBooking } from '@/features/availability/services/bookingService';
import { enforceFreeTierBookingCapBeforeCreate } from '@/features/availability/services/enforceFreeTierBookingCapBeforeCreate';
import { notifyOwnerForAvailabilityBookingCreated } from '@/features/availability/services/notifyOwnerForAvailabilityBookingCreated';
import {
  sendAvailabilityBookingCustomerConfirmationEmail,
  type AvailabilityBookingNotificationPayload,
} from '@/features/email';
import { buildAvailabilityBookingEmailServiceLocation } from '@/features/email/availability-booking-notification/buildAvailabilityBookingEmailServiceLocation';
import { checkMaintenanceAnchorAgainstCalendar } from '@/features/maintenance/server/checkMaintenanceAnchorAgainstCalendar';
import { quoteStartTimeToHHmm } from '@/features/quotes/server/createBookingFromApprovedQuote';
import { buildBookingConfirmedSms, sendAndRecordSms } from '@/features/sms';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT } from '../constants/membershipVisitDuration';
import { linkMembershipPeriodVisit } from './linkMembershipPeriodVisit';
import { mapMembershipStatusToOwner } from './mapCustomerMembershipToOwnerSubscriber';
import { verifyMembershipManageToken } from './membershipManageToken';
import {
  logMemberships,
  shortIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import { resolveMembershipVisitStatus } from './membershipVisitStatus';
import {
  customerMembershipsOf,
  membershipPlansOf,
} from './membershipTablesQuery';
import {
  parseMembershipFirstVisitDate,
  parseMembershipFirstVisitTime,
} from './parseMembershipFirstVisit';

export type CreatePublicMembershipPeriodVisitResult =
  | {
      ok: true;
      bookingId: string;
      scheduledDate: string;
      startTime: string;
    }
  | {
      ok: false;
      error: string;
      status: number;
      code?:
        | 'invalid_token'
        | 'not_found'
        | 'wrong_business'
        | 'not_eligible'
        | 'already_scheduled'
        | 'slot_unavailable'
        | 'free_tier_cap'
        | 'create_failed';
    };

function emptyCustomerForm(snapshot: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}) {
  return {
    fullName: (snapshot.name ?? '').trim() || 'Member',
    email: (snapshot.email ?? '').trim(),
    phone: (snapshot.phone ?? '').trim(),
    streetAddress: '',
    unitApt: '',
    city: '',
    state: '',
    zip: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    notes: (snapshot.notes ?? '').trim() || 'Membership visit.',
  };
}

export async function createPublicMembershipPeriodVisit(
  supabase: SupabaseClient<Database>,
  args: {
    token: string;
    businessSlug: string;
    visitDate: string;
    visitTime: string;
    requestId?: string;
  }
): Promise<CreatePublicMembershipPeriodVisitResult> {
  const requestId = args.requestId;
  const membershipId = verifyMembershipManageToken(args.token);
  if (!membershipId) {
    return {
      ok: false,
      error: 'This schedule link is invalid.',
      status: 401,
      code: 'invalid_token',
    };
  }

  const slug = args.businessSlug.trim();
  const scheduledDate = parseMembershipFirstVisitDate(args.visitDate);
  const startTimeRaw = parseMembershipFirstVisitTime(args.visitTime);
  if (!slug || !scheduledDate || !startTimeRaw) {
    return {
      ok: false,
      error: 'Choose a valid date and time.',
      status: 400,
    };
  }
  const startTime = quoteStartTimeToHHmm(startTimeRaw);

  const { data: business, error: bizErr } = await supabase
    .from('business_profiles')
    .select(
      'id, business_slug, business_name, profile_id, free_bookings_count, service_location_mode, shop_street_address, shop_unit, business_zip'
    )
    .eq('business_slug', slug)
    .maybeSingle();

  if (bizErr || !business) {
    return {
      ok: false,
      error: 'Business not found.',
      status: 404,
      code: 'not_found',
    };
  }

  const biz = business as {
    id: string;
    business_slug?: string | null;
    business_name?: string | null;
    profile_id?: string | null;
    free_bookings_count?: number | null;
    service_location_mode?: string | null;
    shop_street_address?: string | null;
    shop_unit?: string | null;
    business_zip?: string | null;
  };

  const { data: row, error: loadErr } = await customerMembershipsOf(supabase)
    .select(
      'id, business_id, plan_id, customer_id, customer_name, customer_email, customer_phone, notes, status, current_period_start, period_visit_booking_id, period_visit_period_start, initial_booking_id'
    )
    .eq('id', membershipId)
    .maybeSingle();

  if (loadErr) {
    logMemberships(requestId, 'error', 'period_visit.public_load_failed', {
      membershipId: shortIdForLog(membershipId),
      ...supabaseErrorForLogs(loadErr),
    });
    return {
      ok: false,
      error: 'Could not load membership.',
      status: 500,
      code: 'not_found',
    };
  }
  if (!row) {
    return {
      ok: false,
      error: 'Membership not found.',
      status: 404,
      code: 'not_found',
    };
  }
  if ((row.business_id as string) !== biz.id) {
    return {
      ok: false,
      error: 'This link is for a different business.',
      status: 403,
      code: 'wrong_business',
    };
  }

  const status = mapMembershipStatusToOwner(String(row.status ?? ''));
  const visitStatus = resolveMembershipVisitStatus({
    status,
    currentPeriodStart: row.current_period_start as string | null,
    periodVisitBookingId: row.period_visit_booking_id as string | null,
    periodVisitPeriodStart: row.period_visit_period_start as string | null,
  });

  if (visitStatus === 'none') {
    return {
      ok: false,
      error: 'This membership is not active.',
      status: 409,
      code: 'not_eligible',
    };
  }
  if (visitStatus === 'scheduled') {
    return {
      ok: false,
      error: 'A visit is already scheduled for this period.',
      status: 409,
      code: 'already_scheduled',
    };
  }

  let planName = 'Membership visit';
  let durationMinutes = MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT;
  const planId = (row.plan_id as string | null)?.trim();
  if (planId) {
    const { data: planRow } = await membershipPlansOf(supabase)
      .select('name, visit_duration_minutes')
      .eq('id', planId)
      .maybeSingle();
    const plan = planRow as {
      name?: string | null;
      visit_duration_minutes?: number | null;
    } | null;
    if (plan?.name?.trim()) planName = plan.name.trim();
    if (
      typeof plan?.visit_duration_minutes === 'number' &&
      plan.visit_duration_minutes >= 30
    ) {
      durationMinutes = plan.visit_duration_minutes;
    }
  }

  const slotCheck = await checkMaintenanceAnchorAgainstCalendar(supabase, {
    businessId: biz.id,
    anchorDate: scheduledDate,
    anchorTime: startTime,
    durationMinutes,
  });
  if (!slotCheck.ok) {
    return {
      ok: false,
      error: 'That time is no longer available. Pick another slot.',
      status: 409,
      code: 'slot_unavailable',
    };
  }

  const freeTierCap = await enforceFreeTierBookingCapBeforeCreate(supabase, {
    id: biz.id,
    profile_id: biz.profile_id ?? null,
    free_bookings_count: biz.free_bookings_count ?? null,
  });
  if (!freeTierCap.ok) {
    return {
      ok: false,
      error: 'This business is not accepting new appointments right now.',
      status: 403,
      code: 'free_tier_cap',
    };
  }

  const businessSlug = (biz.business_slug ?? '').trim() || slug;
  const businessDisplayName = (biz.business_name ?? '').trim() || businessSlug;
  const customer = emptyCustomerForm({
    name: row.customer_name as string | null,
    email: row.customer_email as string | null,
    phone: row.customer_phone as string | null,
    notes: row.notes as string | null,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let bookingId: string;
  let customerId: string;
  try {
    const out = await createBooking(supabase, {
      businessId: biz.id,
      businessSlug,
      bookingSource: 'public',
      serviceName: planName,
      servicePriceCents: 0,
      durationMinutes,
      scheduledDate,
      startTime,
      customer,
    });
    bookingId = out.id;
    customerId = out.customerId;
  } catch (e) {
    logMemberships(requestId, 'error', 'period_visit.public_insert_failed', {
      membershipId: shortIdForLog(membershipId),
      reason: e instanceof Error ? e.message.slice(0, 120) : 'unknown',
    });
    return {
      ok: false,
      error: 'Could not book that visit. Try again.',
      status: 500,
      code: 'create_failed',
    };
  }

  try {
    await db.from('booking_payments').insert({
      booking_id: bookingId,
      business_id: biz.id,
      provider: 'none',
      payment_status: 'not_required',
      payment_method_selected: 'none',
      currency: 'usd',
      total_amount_cents: 0,
      required_online_amount_cents: 0,
      paid_online_amount_cents: 0,
      remaining_amount_cents: 0,
      last_checkout_session_id: null,
    });
  } catch (payErr) {
    logMemberships(requestId, 'error', 'period_visit.public_payment_failed', {
      membershipId: shortIdForLog(membershipId),
      bookingId: shortIdForLog(bookingId),
      reason:
        payErr instanceof Error ? payErr.message.slice(0, 120) : 'unknown',
    });
    await db.from('bookings').delete().eq('id', bookingId);
    return {
      ok: false,
      error: 'Could not book that visit. Try again.',
      status: 500,
      code: 'create_failed',
    };
  }

  const linked = await linkMembershipPeriodVisit(supabase, {
    businessId: biz.id,
    membershipId,
    bookingId,
    customerId,
    requestId,
  });
  if (!linked.ok) {
    await db.from('bookings').delete().eq('id', bookingId);
    return {
      ok: false,
      error: linked.error,
      status: 500,
      code: 'create_failed',
    };
  }

  const shopLabel = [biz.shop_street_address, biz.shop_unit, biz.business_zip]
    .map(part => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(', ');
  const mode = (biz.service_location_mode ?? '').trim();
  const effectiveType: 'mobile' | 'shop' =
    mode === 'shop_only' || mode === 'shop' ? 'shop' : 'mobile';

  const emailPayload: AvailabilityBookingNotificationPayload = {
    customerName: customer.fullName,
    customerEmail: customer.email || '(not on file)',
    customerPhone: customer.phone || undefined,
    serviceName: planName,
    scheduledDate,
    startTime,
    durationMinutes,
    servicePriceCents: 0,
    totalPriceCents: 0,
    paymentSummary: {
      title: 'Payment',
      rows: [{ label: 'Covered by membership', value: '—' }],
      note: 'This visit is included with your subscription. No separate charge for the appointment.',
    },
    serviceLocation: buildAvailabilityBookingEmailServiceLocation({
      effectiveType,
      shopAddressLabel: shopLabel || null,
      customerStreet: undefined,
      customerUnit: undefined,
      customerCity: undefined,
      customerState: undefined,
      customerZip: undefined,
    }),
    customerNotes: customer.notes,
  };

  try {
    await notifyOwnerForAvailabilityBookingCreated(supabase, {
      correlationId: requestId,
      profileId: biz.profile_id ?? null,
      bookingId,
      customerName: emailPayload.customerName,
      serviceSummaryLine: planName,
      scheduledDate,
      emailPayload,
    });
  } catch {
    // best-effort
  }

  if (customer.email) {
    try {
      await sendAvailabilityBookingCustomerConfirmationEmail(
        customer.email,
        businessDisplayName,
        emailPayload
      );
    } catch {
      // best-effort
    }
  }

  if (customer.phone) {
    try {
      await sendAndRecordSms({
        admin: supabase,
        businessId: biz.id,
        bookingId,
        customerId,
        type: 'booking_confirmation',
        to: customer.phone,
        message: buildBookingConfirmedSms({
          scheduledDate,
          startTime,
        }),
        dedupeKey: `${bookingId}:booking_confirmation`,
        correlationId: requestId,
      });
    } catch {
      // best-effort
    }
  }

  return { ok: true, bookingId, scheduledDate, startTime };
}
