/**
 * After a quote row is marked `approved`, creates the V2 booking, links
 * `quotes.booking_id`, records the public-link response, and notifies the owner.
 */

import { bookingOverlapsTimeOff } from '@/features/availability/booking/utils/slotGeneration';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import {
  checkFreeTierBookingCapAllowsCreate,
  persistFreeTierBookingIncrementAfterBooking,
} from '@/features/availability/services/enforceFreeTierBookingCapBeforeCreate';
import { notifyOwnerForAvailabilityBookingCreated } from '@/features/availability/services/notifyOwnerForAvailabilityBookingCreated';
import { parseStoredTimeOffBlocks } from '@/features/availability/types/blockTime';
import { normalizePhoneForLookup } from '@/features/customer-management/server/normalizeCustomerContact';
import type { AvailabilityBookingNotificationPayload } from '@/features/email';
import {
  mergeQuoteRowWithRespondFallback,
  type QuoteRespondStructuredAddress,
} from '@/features/quotes/public-view/quoteRespondAddress';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createBookingFromApprovedQuote,
  quoteStartTimeToHHmm,
  type QuoteRowForApprovedBooking,
} from './createBookingFromApprovedQuote';

export type BusinessProfileForQuoteApproval = {
  id: string;
  profile_id: string | null;
  business_slug: string | null;
  business_name: string | null;
  free_bookings_month: string | null;
  free_bookings_count: number | null;
};

export type FinalizeApprovedQuoteResult =
  | { ok: true; bookingId: string; alreadyCompleted?: boolean }
  | { ok: false; httpStatus: number; message: string };

function rowToQuotePayload(
  row: Record<string, unknown>
): QuoteRowForApprovedBooking {
  return {
    id: String(row.id),
    business_id: String(row.business_id),
    customer_name: String(row.customer_name ?? ''),
    customer_email: String(row.customer_email ?? ''),
    customer_phone: (row.customer_phone as string | null) ?? null,
    customer_street_address:
      (row.customer_street_address as string | null) ?? null,
    customer_unit_apt: (row.customer_unit_apt as string | null) ?? null,
    customer_city: (row.customer_city as string | null) ?? null,
    customer_state: (row.customer_state as string | null) ?? null,
    customer_zip: (row.customer_zip as string | null) ?? null,
    service_address: (row.service_address as string | null) ?? null,
    service_name: (row.service_name as string | null) ?? null,
    price_cents: (row.price_cents as number | null) ?? null,
    duration_minutes: (row.duration_minutes as number | null) ?? null,
    scheduled_date: (row.scheduled_date as string | null) ?? null,
    scheduled_start_time: (row.scheduled_start_time as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    request_message: (row.request_message as string | null) ?? null,
    vehicle_year: (row.vehicle_year as string | null) ?? null,
    vehicle_make: (row.vehicle_make as string | null) ?? null,
    vehicle_model: (row.vehicle_model as string | null) ?? null,
  };
}

function buildEmailPayload(
  quote: QuoteRowForApprovedBooking,
  serviceNameForOwner: string,
  startTime: string,
  durationMinutes: number
): AvailabilityBookingNotificationPayload {
  const base = quote.price_cents ?? 0;
  const phoneDigits = normalizePhoneForLookup(quote.customer_phone);
  return {
    customerName: quote.customer_name.trim(),
    customerEmail: quote.customer_email.trim(),
    customerPhone: phoneDigits ?? undefined,
    customerVehicleYear: quote.vehicle_year?.trim() || undefined,
    customerVehicleMake: quote.vehicle_make?.trim() || undefined,
    customerVehicleModel: quote.vehicle_model?.trim() || undefined,
    serviceName: serviceNameForOwner,
    scheduledDate: quote.scheduled_date!.trim(),
    startTime,
    durationMinutes,
    servicePriceCents: quote.price_cents ?? undefined,
    selectedAddOns: [],
    totalPriceCents: base,
  };
}

/**
 * `quote` must already have `status === 'approved'` and `booking_id` null.
 * `respondAddressFallback` fills missing structured columns (repair path).
 */
export async function finalizeApprovedQuoteToBooking(
  supabase: SupabaseClient<Database>,
  params: {
    quoteRow: Record<string, unknown>;
    respondAddressFallback: QuoteRespondStructuredAddress;
    linkId: string;
    nowIso: string;
    businessProfile: BusinessProfileForQuoteApproval;
  }
): Promise<FinalizeApprovedQuoteResult> {
  const { quoteRow, respondAddressFallback, linkId, nowIso, businessProfile } =
    params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const mergedRow = mergeQuoteRowWithRespondFallback(
    quoteRow,
    respondAddressFallback
  );
  const quote = rowToQuotePayload(mergedRow);
  const scheduledDate = quote.scheduled_date?.trim();
  if (!scheduledDate) {
    return {
      ok: false,
      httpStatus: 400,
      message: 'This quote is missing a scheduled date',
    };
  }

  const startTime = quoteStartTimeToHHmm(quote.scheduled_start_time);
  const durationMinutes = Math.max(1, quote.duration_minutes ?? 60);

  const hasStreet =
    quote.customer_street_address?.trim() || quote.service_address?.trim();
  if (!hasStreet) {
    return {
      ok: false,
      httpStatus: 400,
      message: 'This quote is missing a service address',
    };
  }

  const cap = await checkFreeTierBookingCapAllowsCreate(supabase, {
    id: businessProfile.id,
    profile_id: businessProfile.profile_id,
    free_bookings_month: businessProfile.free_bookings_month,
    free_bookings_count: businessProfile.free_bookings_count,
  });
  if (!cap.ok) {
    return { ok: false, httpStatus: 403, message: cap.message };
  }

  const availabilityRow = await getAvailabilityForBusiness(
    supabase,
    quote.business_id
  );
  const timeOffIntervals = parseStoredTimeOffBlocks(
    availabilityRow?.time_off_blocks
  );
  if (
    bookingOverlapsTimeOff(
      scheduledDate,
      startTime,
      durationMinutes,
      timeOffIntervals
    )
  ) {
    return {
      ok: false,
      httpStatus: 409,
      message:
        'That time is not available anymore. Please contact the business to reschedule.',
    };
  }

  const businessSlug = businessProfile.business_slug?.trim() ?? '';

  let bookingId: string;
  try {
    const out = await createBookingFromApprovedQuote(
      supabase,
      quote,
      businessSlug
    );
    bookingId = out.bookingId;
  } catch (e) {
    console.error('[quotes] createBookingFromApprovedQuote failed', e);
    return {
      ok: false,
      httpStatus: 500,
      message: 'Failed to create booking from quote',
    };
  }

  const { data: linkedRow, error: bookingLinkError } = await db
    .from('quotes')
    .update({ booking_id: bookingId })
    .eq('id', quote.id)
    .is('booking_id', null)
    .select('id')
    .maybeSingle();

  if (bookingLinkError) {
    console.error('[quotes] Failed to set quotes.booking_id', bookingLinkError);
    await db.from('bookings').delete().eq('id', bookingId);
    return {
      ok: false,
      httpStatus: 500,
      message: 'Failed to link booking to quote',
    };
  }

  if (!linkedRow) {
    await db.from('bookings').delete().eq('id', bookingId);
    const { data: freshQuote } = await db
      .from('quotes')
      .select('booking_id')
      .eq('id', quote.id)
      .maybeSingle();
    const existingId = (freshQuote as { booking_id?: string | null } | null)
      ?.booking_id;
    if (existingId) {
      return {
        ok: true,
        bookingId: existingId,
        alreadyCompleted: true,
      };
    }
    return {
      ok: false,
      httpStatus: 500,
      message: 'Failed to link booking to quote',
    };
  }

  await persistFreeTierBookingIncrementAfterBooking(
    supabase,
    quote.business_id
  );
  const serviceNameForOwner = quote.service_name?.trim() || 'Quoted service';

  const emailPayload = buildEmailPayload(
    quote,
    serviceNameForOwner,
    startTime,
    durationMinutes
  );

  const { error: linkError } = await db
    .from('quote_public_links')
    .update({
      response_status: 'approved',
      responded_at: nowIso,
    })
    .eq('id', linkId);

  if (linkError) {
    console.error('[quotes] Failed to update quote_public_links', linkError);
    return {
      ok: false,
      httpStatus: 500,
      message: 'Failed to record response',
    };
  }

  await notifyOwnerForAvailabilityBookingCreated(supabase, {
    profileId: businessProfile.profile_id,
    bookingId,
    customerName: quote.customer_name.trim(),
    serviceSummaryLine: serviceNameForOwner,
    scheduledDate,
    emailPayload,
  });

  return { ok: true, bookingId };
}

export async function revertQuoteToRespondableState(
  supabase: SupabaseClient<Database>,
  quoteId: string,
  previousStatus: 'sent' | 'viewed'
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  await db
    .from('quotes')
    .update({
      status: previousStatus,
      approved_at: null,
      service_address: null,
      customer_street_address: null,
      customer_unit_apt: null,
      customer_city: null,
      customer_state: null,
      customer_zip: null,
    })
    .eq('id', quoteId)
    .eq('status', 'approved');
}
