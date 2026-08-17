/**
 * After membership Checkout succeeds, create one `bookings` row for the first
 * visit (slot from Stripe session metadata). Idempotent via
 * `customer_memberships.initial_booking_id`.
 */

import { createBooking } from '@/features/availability/services/bookingService';
import { enforceFreeTierBookingCapBeforeCreate } from '@/features/availability/services/enforceFreeTierBookingCapBeforeCreate';
import { notifyOwnerForAvailabilityBookingCreated } from '@/features/availability/services/notifyOwnerForAvailabilityBookingCreated';
import {
  sendAvailabilityBookingCustomerConfirmationEmail,
  type AvailabilityBookingNotificationPayload,
} from '@/features/email';
import {
  buildMembershipVisitPaymentSummary,
  membershipVisitNotesForEmail,
} from '@/features/email/availability-booking-notification/buildAvailabilityBookingPaymentSummary';
import { buildAvailabilityBookingEmailServiceLocation } from '@/features/email/availability-booking-notification/buildAvailabilityBookingEmailServiceLocation';
import { checkMaintenanceAnchorAgainstCalendar } from '@/features/maintenance/server/checkMaintenanceAnchorAgainstCalendar';
import { quoteStartTimeToHHmm } from '@/features/quotes/server/createBookingFromApprovedQuote';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT } from '../constants/membershipVisitDuration';
import {
  logMemberships,
  shortIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import {
  parseMembershipFirstVisitDate,
  parseMembershipFirstVisitTime,
} from './parseMembershipFirstVisit';
import {
  customerMembershipsOf,
  membershipPlansOf,
} from './membershipTablesQuery';
import {
  mergeMembershipServiceSnapshots,
  resolveMembershipCustomerServiceSnapshot,
} from './resolveMembershipCustomerServiceSnapshot';

export type EnsureMembershipBookingResult = {
  bookingId: string | null;
  created: boolean;
  customerEmailSent?: boolean;
  skippedReason?:
    | 'load_failed'
    | 'not_found'
    | 'no_visit_slot'
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

function emptyCustomerForm(snapshot: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  street?: string | null;
  unit?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  vehicleYear?: string | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
}) {
  return {
    fullName: (snapshot.name ?? '').trim() || 'Member',
    email: (snapshot.email ?? '').trim(),
    phone: (snapshot.phone ?? '').trim(),
    streetAddress: (snapshot.street ?? '').trim(),
    unitApt: (snapshot.unit ?? '').trim(),
    city: (snapshot.city ?? '').trim(),
    state: (snapshot.state ?? '').trim(),
    zip: (snapshot.zip ?? '').trim(),
    vehicleYear: (snapshot.vehicleYear ?? '').trim(),
    vehicleMake: (snapshot.vehicleMake ?? '').trim(),
    vehicleModel: (snapshot.vehicleModel ?? '').trim(),
    notes: 'Membership visit.',
  };
}

/**
 * @param visitFromSession — Stripe Checkout session metadata visit fields
 */
export async function ensureMembershipInitialBooking(
  supabase: SupabaseClient<Database>,
  args: {
    membershipId: string;
    visitFromSession: {
      firstVisitDate?: string | null;
      firstVisitTime?: string | null;
      visitDurationMinutes?: string | null;
    };
    customerSnapshot?: {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      street?: string | null;
      unit?: string | null;
      city?: string | null;
      state?: string | null;
      zip?: string | null;
      vehicleYear?: string | null;
      vehicleMake?: string | null;
      vehicleModel?: string | null;
    } | null;
    stripeCheckoutSessionId?: string | null;
    requestId?: string;
  }
): Promise<EnsureMembershipBookingResult> {
  const membershipId = args.membershipId.trim();
  const requestId = args.requestId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: row, error: loadErr } = await customerMembershipsOf(supabase)
    .select(
      'id, business_id, plan_id, customer_id, customer_name, customer_email, customer_phone, initial_booking_id, current_period_start'
    )
    .eq('id', membershipId)
    .maybeSingle();

  if (loadErr) {
    logMemberships(requestId, 'error', 'initial_booking.load_failed', {
      membershipId: shortIdForLog(membershipId),
      ...supabaseErrorForLogs(loadErr),
    });
    return { bookingId: null, created: false, skippedReason: 'load_failed' };
  }

  const membership = row as {
    id: string;
    business_id: string;
    plan_id: string | null;
    customer_id: string | null;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    initial_booking_id: string | null;
    current_period_start: string | null;
  } | null;

  if (!membership) {
    return { bookingId: null, created: false, skippedReason: 'not_found' };
  }

  const existingId = membership.initial_booking_id?.trim();
  if (existingId) {
    return { bookingId: existingId, created: false };
  }

  const scheduledDate = parseMembershipFirstVisitDate(
    args.visitFromSession.firstVisitDate
  );
  const startTimeRaw = parseMembershipFirstVisitTime(
    args.visitFromSession.firstVisitTime
  );
  if (!scheduledDate || !startTimeRaw) {
    logMemberships(requestId, 'warn', 'initial_booking.no_visit_slot', {
      membershipId: shortIdForLog(membershipId),
      reason: 'Checkout metadata missing first visit date/time',
    });
    return { bookingId: null, created: false, skippedReason: 'no_visit_slot' };
  }

  const startTime = quoteStartTimeToHHmm(startTimeRaw);

  let planName = 'Membership visit';
  let durationMinutes = MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT;
  const planId = membership.plan_id?.trim();
  if (planId) {
    const { data: planRow } = await membershipPlansOf(supabase)
      .select('name, visit_duration_minutes')
      .eq('id', planId)
      .maybeSingle();
    const plan = planRow as {
      name?: string | null;
      visit_duration_minutes?: number | null;
    } | null;
    if (plan?.name?.trim()) {
      planName = plan.name.trim();
    }
    if (
      typeof plan?.visit_duration_minutes === 'number' &&
      plan.visit_duration_minutes >= 30
    ) {
      durationMinutes = plan.visit_duration_minutes;
    }
  } else {
    const fromMeta = Number(args.visitFromSession.visitDurationMinutes);
    if (
      Number.isInteger(fromMeta) &&
      fromMeta >= 30 &&
      fromMeta <= 630 &&
      fromMeta % 30 === 0
    ) {
      durationMinutes = fromMeta;
    }
  }

  const serviceName = planName;

  const slotCheck = await checkMaintenanceAnchorAgainstCalendar(supabase, {
    businessId: membership.business_id,
    anchorDate: scheduledDate,
    anchorTime: startTime,
    durationMinutes,
  });
  if (!slotCheck.ok) {
    logMemberships(requestId, 'warn', 'initial_booking.calendar_conflict', {
      membershipId: shortIdForLog(membershipId),
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
      'business_slug, business_name, profile_id, free_bookings_count, service_location_mode, shop_street_address, shop_unit, business_zip'
    )
    .eq('id', membership.business_id)
    .maybeSingle();

  if (bizErr || !businessRow) {
    logMemberships(requestId, 'error', 'initial_booking.business_missing', {
      membershipId: shortIdForLog(membershipId),
      businessId: shortIdForLog(membership.business_id),
      ...supabaseErrorForLogs(bizErr),
    });
    return {
      bookingId: null,
      created: false,
      skippedReason: 'business_not_found',
    };
  }

  const biz = businessRow as {
    business_slug?: string | null;
    business_name?: string | null;
    profile_id?: string | null;
    free_bookings_count?: number | null;
    service_location_mode?: string | null;
    shop_street_address?: string | null;
    shop_unit?: string | null;
    business_zip?: string | null;
  };

  const freeTierCap = await enforceFreeTierBookingCapBeforeCreate(supabase, {
    id: membership.business_id,
    profile_id: biz.profile_id ?? null,
    free_bookings_count: biz.free_bookings_count ?? null,
  });
  if (!freeTierCap.ok) {
    logMemberships(requestId, 'warn', 'initial_booking.free_tier_cap', {
      membershipId: shortIdForLog(membershipId),
      businessId: shortIdForLog(membership.business_id),
    });
    return {
      bookingId: null,
      created: false,
      skippedReason: 'free_tier_cap',
    };
  }

  const businessSlug = (biz.business_slug ?? '').trim() || 'business';
  const businessDisplayName = (biz.business_name ?? '').trim() || businessSlug;

  const phone =
    args.customerSnapshot?.phone?.trim() ||
    membership.customer_phone?.trim() ||
    '';
  const email =
    args.customerSnapshot?.email?.trim() ||
    membership.customer_email?.trim() ||
    '';

  const crmSnapshot = await resolveMembershipCustomerServiceSnapshot(supabase, {
    businessId: membership.business_id,
    phone,
    email,
    customerId: membership.customer_id,
  });
  const serviceSnapshot = mergeMembershipServiceSnapshots(crmSnapshot, {
    address: {
      street: args.customerSnapshot?.street ?? undefined,
      unit: args.customerSnapshot?.unit ?? undefined,
      city: args.customerSnapshot?.city ?? undefined,
      state: args.customerSnapshot?.state ?? undefined,
      zip: args.customerSnapshot?.zip ?? undefined,
    },
    vehicle: {
      year: args.customerSnapshot?.vehicleYear ?? undefined,
      make: args.customerSnapshot?.vehicleMake ?? undefined,
      model: args.customerSnapshot?.vehicleModel ?? undefined,
    },
  });

  const customer = emptyCustomerForm({
    name: args.customerSnapshot?.name ?? membership.customer_name,
    email,
    phone,
    street: serviceSnapshot.address.street,
    unit: serviceSnapshot.address.unit,
    city: serviceSnapshot.address.city,
    state: serviceSnapshot.address.state,
    zip: serviceSnapshot.address.zip,
    vehicleYear: serviceSnapshot.vehicle.year,
    vehicleMake: serviceSnapshot.vehicle.make,
    vehicleModel: serviceSnapshot.vehicle.model,
  });

  let bookingId: string;
  let customerId: string;
  try {
    const out = await createBooking(supabase, {
      businessId: membership.business_id,
      businessSlug,
      bookingSource: 'public',
      serviceName,
      servicePriceCents: 0,
      durationMinutes,
      scheduledDate,
      startTime,
      customer,
    });
    bookingId = out.id;
    customerId = out.customerId;
  } catch (e) {
    logMemberships(requestId, 'error', 'initial_booking.insert_failed', {
      membershipId: shortIdForLog(membershipId),
      reason: e instanceof Error ? e.message.slice(0, 120) : 'unknown',
    });
    return {
      bookingId: null,
      created: false,
      skippedReason: 'insert_failed',
    };
  }

  {
    const { error: payErr } = await db.from('booking_payments').insert({
      booking_id: bookingId,
      business_id: membership.business_id,
      provider: 'none',
      payment_status: 'not_required',
      payment_method_selected: 'membership',
      currency: 'usd',
      total_amount_cents: 0,
      required_online_amount_cents: 0,
      paid_online_amount_cents: 0,
      remaining_amount_cents: 0,
      last_checkout_session_id: args.stripeCheckoutSessionId?.trim() || null,
    });
    if (payErr) {
      logMemberships(requestId, 'error', 'initial_booking.payment_row_failed', {
        membershipId: shortIdForLog(membershipId),
        bookingId: shortIdForLog(bookingId),
        ...supabaseErrorForLogs(payErr),
      });
      await db.from('bookings').delete().eq('id', bookingId);
      return {
        bookingId: null,
        created: false,
        skippedReason: 'payment_row_failed',
      };
    }
  }

  const periodStart = membership.current_period_start?.trim() || null;
  const { data: linked, error: linkErr } = await customerMembershipsOf(supabase)
    .update({
      initial_booking_id: bookingId,
      customer_id: customerId,
      period_visit_booking_id: bookingId,
      ...(periodStart ? { period_visit_period_start: periodStart } : {}),
    })
    .eq('id', membershipId)
    .is('initial_booking_id', null)
    .select('initial_booking_id')
    .maybeSingle();

  if (linkErr) {
    logMemberships(requestId, 'error', 'initial_booking.link_failed', {
      membershipId: shortIdForLog(membershipId),
      bookingId: shortIdForLog(bookingId),
      ...supabaseErrorForLogs(linkErr),
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
    const { data: other } = await customerMembershipsOf(supabase)
      .select('initial_booking_id')
      .eq('id', membershipId)
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
    serviceName,
    scheduledDate,
    startTime,
    durationMinutes,
    servicePriceCents: 0,
    totalPriceCents: 0,
    paymentSummary: buildMembershipVisitPaymentSummary(),
    serviceLocation: buildAvailabilityBookingEmailServiceLocation({
      effectiveType,
      shopAddressLabel: shopLabel || null,
      customerStreet: undefined,
      customerUnit: undefined,
      customerCity: undefined,
      customerState: undefined,
      customerZip: undefined,
    }),
    customerNotes: membershipVisitNotesForEmail(customer.notes),
  };

  try {
    await notifyOwnerForAvailabilityBookingCreated(supabase, {
      correlationId: requestId,
      profileId: biz.profile_id ?? null,
      bookingId,
      customerName: emailPayload.customerName,
      serviceSummaryLine: serviceName,
      scheduledDate,
      emailPayload,
    });
  } catch (notifyErr) {
    logMemberships(requestId, 'warn', 'initial_booking.owner_notify_failed', {
      membershipId: shortIdForLog(membershipId),
      bookingId: shortIdForLog(bookingId),
      reason:
        notifyErr instanceof Error
          ? notifyErr.message.slice(0, 120)
          : 'unknown',
    });
  }

  let customerEmailSent = false;
  if (customer.email) {
    try {
      const sent = await sendAvailabilityBookingCustomerConfirmationEmail(
        customer.email,
        businessDisplayName,
        emailPayload
      );
      customerEmailSent = sent.sent;
      if (!sent.sent) {
        logMemberships(requestId, 'warn', 'initial_booking.customer_mail', {
          membershipId: shortIdForLog(membershipId),
          bookingId: shortIdForLog(bookingId),
          reason: sent.error?.slice(0, 120) ?? 'not_sent',
        });
      }
    } catch (emailErr) {
      logMemberships(requestId, 'warn', 'initial_booking.customer_mail', {
        membershipId: shortIdForLog(membershipId),
        bookingId: shortIdForLog(bookingId),
        reason:
          emailErr instanceof Error
            ? emailErr.message.slice(0, 120)
            : 'unknown',
      });
    }
  }

  return { bookingId, created: true, customerEmailSent };
}
