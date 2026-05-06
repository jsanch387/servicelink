/**
 * Availability feature – V2 (availability) bookings: create and list.
 * Used by API routes only. Do not import from client components.
 */

import {
  ownerBookingSlotValidationMessage,
  validateOwnerBookingSlot,
} from '@/features/availability/booking/server/validateOwnerBookingSlot';
import { upsertCustomerForBooking } from '@/features/customer-management/server/upsertCustomerForBooking';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  mapBookingRowToDisplay,
  type BookingRow,
} from '../booking/dashboard/utils/mapBookingRowToDisplay';
import type { AddOnAtBooking, CustomerFormData } from '../booking/types';

const TABLE = 'bookings';

export interface CreateBookingPayload {
  business_id: string;
  business_slug: string | null;
  service_id: string | null;
  service_name: string;
  service_price_cents: number | null;
  addon_details: AddOnAtBooking[] | null;
  duration_minutes: number;
  scheduled_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm (Postgres time accepts this)
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_street_address: string | null;
  customer_unit_apt: string | null;
  customer_city: string | null;
  customer_state: string | null;
  customer_zip: string | null;
  customer_vehicle_year: string | null;
  customer_vehicle_make: string | null;
  customer_vehicle_model: string | null;
  customer_notes: string | null;
  customer_id: string;
}

function mapCustomerToRow(
  c: CustomerFormData
): Omit<
  CreateBookingPayload,
  | 'business_id'
  | 'business_slug'
  | 'service_id'
  | 'service_name'
  | 'service_price_cents'
  | 'addon_details'
  | 'duration_minutes'
  | 'scheduled_date'
  | 'start_time'
  | 'customer_id'
> {
  return {
    customer_name: c.fullName.trim(),
    customer_email: c.email.trim(),
    customer_phone: c.phone?.trim() || null,
    customer_street_address: c.streetAddress?.trim() || null,
    customer_unit_apt: c.unitApt?.trim() || null,
    customer_city: c.city?.trim() || null,
    customer_state: c.state?.trim() || null,
    customer_zip: c.zip?.trim() || null,
    customer_vehicle_year: c.vehicleYear?.trim() || null,
    customer_vehicle_make: c.vehicleMake?.trim() || null,
    customer_vehicle_model: c.vehicleModel?.trim() || null,
    customer_notes: c.notes?.trim() || null,
  };
}

/**
 * Inserts one booking row. Uses admin/service client so RLS does not block insert.
 * Caller must validate slot and resolve business by slug before calling.
 */
export async function createBooking(
  supabase: SupabaseClient<Database>,
  payload: {
    businessId: string;
    businessSlug: string;
    serviceId?: string;
    serviceName: string;
    servicePriceCents?: number;
    selectedAddOns?: AddOnAtBooking[];
    durationMinutes: number;
    scheduledDate: string;
    startTime: string;
    customer: CustomerFormData;
  }
): Promise<{ id: string }> {
  const addonDetails =
    payload.selectedAddOns?.length && payload.selectedAddOns.length > 0
      ? payload.selectedAddOns
      : null;

  const { id: customerId } = await upsertCustomerForBooking(
    supabase,
    payload.businessId,
    {
      fullName: payload.customer.fullName,
      email: payload.customer.email,
      phone: payload.customer.phone,
    }
  );

  const row: CreateBookingPayload = {
    business_id: payload.businessId,
    business_slug: payload.businessSlug || null,
    service_id: payload.serviceId ?? null,
    service_name: payload.serviceName.trim(),
    service_price_cents: payload.servicePriceCents ?? null,
    addon_details: addonDetails,
    duration_minutes: payload.durationMinutes,
    scheduled_date: payload.scheduledDate,
    start_time: payload.startTime,
    ...mapCustomerToRow(payload.customer),
    customer_id: customerId,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .insert(row)
    .select('id, customer_id')
    .single();

  if (error) {
    throw error;
  }

  if (!data?.customer_id) {
    throw new Error(
      'Booking was created without customer_id. Add a nullable `customer_id` uuid column on `bookings` referencing `customers(id)` (or fix RLS) so each booking links to a customer row.'
    );
  }

  return { id: data.id };
}

/** Address / vehicle snapshot from the customer's most recent booking, if any. */
async function loadLatestBookingCustomerSnapshotForCustomer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  businessId: string,
  customerId: string
): Promise<Partial<
  Pick<
    CustomerFormData,
    | 'streetAddress'
    | 'unitApt'
    | 'city'
    | 'state'
    | 'zip'
    | 'vehicleYear'
    | 'vehicleMake'
    | 'vehicleModel'
  >
> | null> {
  const { data, error } = await db
    .from('bookings')
    .select(
      'customer_street_address, customer_unit_apt, customer_city, customer_state, customer_zip, customer_vehicle_year, customer_vehicle_make, customer_vehicle_model'
    )
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as {
    customer_street_address?: string | null;
    customer_unit_apt?: string | null;
    customer_city?: string | null;
    customer_state?: string | null;
    customer_zip?: string | null;
    customer_vehicle_year?: string | null;
    customer_vehicle_make?: string | null;
    customer_vehicle_model?: string | null;
  };

  const street = String(row.customer_street_address ?? '').trim();
  const city = String(row.customer_city ?? '').trim();
  if (!street && !city) {
    return null;
  }

  return {
    streetAddress: street,
    unitApt: String(row.customer_unit_apt ?? '').trim(),
    city,
    state: String(row.customer_state ?? '').trim(),
    zip: String(row.customer_zip ?? '').trim(),
    vehicleYear: String(row.customer_vehicle_year ?? '').trim(),
    vehicleMake: String(row.customer_vehicle_make ?? '').trim(),
    vehicleModel: String(row.customer_vehicle_model ?? '').trim(),
  };
}

/**
 * Inserts a booking for an existing `customers` row (no upsert). Denormalized
 * customer fields are copied from the customer record; address/vehicle are
 * filled from their latest booking when present. Server-only.
 */
export async function createBookingForExistingCustomer(
  supabase: SupabaseClient<Database>,
  payload: {
    businessId: string;
    businessSlug: string;
    customerId: string;
    serviceId?: string | null;
    serviceName: string;
    servicePriceCents?: number | null;
    selectedAddOns?: AddOnAtBooking[];
    durationMinutes: number;
    scheduledDate: string;
    startTime: string;
    /** Stored on `bookings.customer_notes` only (not merged into `customers.notes`). */
    bookingCustomerNotes?: string | null;
  }
): Promise<{ id: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: customerRow, error: loadErr } = await db
    .from('customers')
    .select('id, business_id, full_name, phone, email, email_normalized, notes')
    .eq('id', payload.customerId)
    .eq('business_id', payload.businessId)
    .maybeSingle();

  if (loadErr) {
    throw loadErr;
  }
  if (!customerRow) {
    throw new Error('Customer not found for booking');
  }

  const c = customerRow as {
    full_name?: string | null;
    phone?: string | null;
    email?: string | null;
    email_normalized?: string | null;
  };

  const emailRaw = (c.email_normalized ?? c.email ?? '').trim();
  const fromPrior = await loadLatestBookingCustomerSnapshotForCustomer(
    db,
    payload.businessId,
    payload.customerId
  );

  const customer: CustomerFormData = {
    fullName: (c.full_name ?? '').trim() || 'Customer',
    email: emailRaw,
    phone: (c.phone ?? '').trim(),
    streetAddress: fromPrior?.streetAddress ?? '',
    unitApt: fromPrior?.unitApt ?? '',
    city: fromPrior?.city ?? '',
    state: fromPrior?.state ?? '',
    zip: fromPrior?.zip ?? '',
    vehicleYear: fromPrior?.vehicleYear ?? '',
    vehicleMake: fromPrior?.vehicleMake ?? '',
    vehicleModel: fromPrior?.vehicleModel ?? '',
    notes: (payload.bookingCustomerNotes ?? '').trim(),
  };

  const addonDetails =
    payload.selectedAddOns?.length && payload.selectedAddOns.length > 0
      ? payload.selectedAddOns
      : null;

  const row: CreateBookingPayload = {
    business_id: payload.businessId,
    business_slug: payload.businessSlug || null,
    service_id: payload.serviceId ?? null,
    service_name: payload.serviceName.trim(),
    service_price_cents: payload.servicePriceCents ?? null,
    addon_details: addonDetails,
    duration_minutes: payload.durationMinutes,
    scheduled_date: payload.scheduledDate,
    start_time: payload.startTime.trim(),
    ...mapCustomerToRow(customer),
    customer_id: payload.customerId,
  };

  const { data, error } = await db
    .from(TABLE)
    .insert(row)
    .select('id, customer_id')
    .single();

  if (error) {
    throw error;
  }

  if (!data?.customer_id) {
    throw new Error('Booking was created without customer_id');
  }

  return { id: data.id };
}

/** How the customer committed to pay when no Stripe checkout row is involved. */
export type PublicBookingNoCheckoutPaymentMethod =
  | 'pay_now'
  | 'pay_in_person'
  | 'none';

/**
 * Inserts `booking_payments` for bookings created via POST /api/public/bookings
 * (pay in person, payments off, or $0 confirm). Card-paid bookings get their row
 * from the Stripe webhook instead.
 */
export async function insertBookingPaymentsRowForNoCheckoutPublicBooking(
  supabase: SupabaseClient<Database>,
  args: {
    bookingId: string;
    businessId: string;
    totalAmountCents: number;
    currency: string;
    paymentsEnabled: boolean;
    checkoutMode: string | null | undefined;
    /** When `checkout_mode` is `customer_choice`, the customer's chosen path. */
    clientPaymentMethod?: PublicBookingNoCheckoutPaymentMethod | null;
  }
): Promise<void> {
  const total = Math.max(0, Math.round(args.totalAmountCents));
  const cur = /^[a-z]{3}$/.test(args.currency.trim().toLowerCase())
    ? args.currency.trim().toLowerCase()
    : 'usd';

  let paymentMethodSelected: PublicBookingNoCheckoutPaymentMethod = 'none';
  const mode = String(args.checkoutMode ?? '').trim();
  if (!args.paymentsEnabled || !mode) {
    paymentMethodSelected = 'none';
  } else if (mode === 'in_person') {
    paymentMethodSelected = 'pay_in_person';
  } else if (mode === 'customer_choice') {
    paymentMethodSelected =
      args.clientPaymentMethod === 'pay_in_person' ? 'pay_in_person' : 'none';
  } else {
    paymentMethodSelected = 'none';
  }

  const paymentStatus =
    paymentMethodSelected === 'pay_in_person' && total > 0
      ? 'awaiting_payment'
      : 'not_required';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('booking_payments').insert({
    booking_id: args.bookingId,
    business_id: args.businessId,
    provider: 'none',
    payment_status: paymentStatus,
    payment_method_selected: paymentMethodSelected,
    currency: cur,
    total_amount_cents: total,
    required_online_amount_cents: 0,
    paid_online_amount_cents: 0,
    remaining_amount_cents: total,
    deposit_type: null,
    deposit_value: null,
    last_checkout_session_id: null,
    paid_at: null,
  });

  if (error) {
    throw error;
  }
}

/**
 * Lists all bookings for a business (owner view). Use with authenticated
 * client so RLS allows SELECT for their business_id.
 */
export async function listBookingsForBusiness(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<ReturnType<typeof mapBookingRowToDisplay>[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .select('*')
    .eq('business_id', businessId)
    .order('scheduled_date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as BookingRow[];
  const bookingIds = rows.map(r => r.id);
  const paymentByBookingId = new Map<
    string,
    {
      payment_status: string | null;
      payment_method_selected: string | null;
      currency: string | null;
      total_amount_cents: number | null;
      paid_online_amount_cents: number | null;
      remaining_amount_cents: number | null;
    }
  >();

  if (bookingIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: paymentRows } = await (supabase as any)
      .from('booking_payments')
      .select(
        'booking_id, payment_status, payment_method_selected, currency, total_amount_cents, paid_online_amount_cents, remaining_amount_cents'
      )
      .in('booking_id', bookingIds);

    const normalized = (paymentRows ?? []) as Array<{
      booking_id: string;
      payment_status: string | null;
      payment_method_selected: string | null;
      currency: string | null;
      total_amount_cents: number | null;
      paid_online_amount_cents: number | null;
      remaining_amount_cents: number | null;
    }>;

    for (const p of normalized) {
      if (!p.booking_id) continue;
      paymentByBookingId.set(p.booking_id, p);
    }
  }

  return rows.map(row => {
    const display = mapBookingRowToDisplay(row);
    const payment = paymentByBookingId.get(row.id);
    if (!payment) {
      return display;
    }
    return {
      ...display,
      payment: {
        paymentStatus: payment.payment_status ?? 'not_required',
        paymentMethodSelected: String(
          payment.payment_method_selected ?? 'none'
        ),
        currency: (payment.currency ?? 'usd').toLowerCase(),
        totalAmountCents: Math.max(0, payment.total_amount_cents ?? 0),
        paidOnlineAmountCents: Math.max(
          0,
          payment.paid_online_amount_cents ?? 0
        ),
        remainingAmountCents: Math.max(0, payment.remaining_amount_cents ?? 0),
      },
    };
  });
}

export type BookingStatusUpdate = 'completed' | 'cancelled';

/**
 * Updates a booking's status. Use with authenticated client; RLS ensures
 * only the business owner can update. Returns the updated row or null if
 * not found / not allowed.
 */
export async function updateBookingStatus(
  supabase: SupabaseClient<Database>,
  bookingId: string,
  status: BookingStatusUpdate
): Promise<BookingRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .update({ status })
    .eq('id', bookingId)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as BookingRow | null;
}

export type RescheduleBookingForOwnerResult =
  | { ok: true; row: BookingRow }
  | { ok: false; error: string; httpStatus: number };

/**
 * Moves a confirmed booking to a new date/time after calendar validation.
 * Caller must pass `businessId` from the authenticated owner context.
 */
export async function rescheduleBookingForOwner(
  supabase: SupabaseClient<Database>,
  params: {
    businessId: string;
    bookingId: string;
    scheduledDate: string;
    startTimeHHmm: string;
  }
): Promise<RescheduleBookingForOwnerResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: row, error: loadErr } = await db
    .from(TABLE)
    .select('*')
    .eq('id', params.bookingId.trim())
    .eq('business_id', params.businessId)
    .maybeSingle();

  if (loadErr) {
    console.error('[rescheduleBookingForOwner] load', loadErr);
    return {
      ok: false,
      error: 'Could not load this booking. Please try again.',
      httpStatus: 500,
    };
  }

  if (!row) {
    return { ok: false, error: 'Booking not found.', httpStatus: 404 };
  }

  const status = String((row as BookingRow).status ?? '').trim();
  if (status !== 'confirmed') {
    return {
      ok: false,
      error: 'Only confirmed appointments can be rescheduled.',
      httpStatus: 409,
    };
  }

  const durationMinutes = Math.max(
    1,
    Math.round(Number((row as BookingRow).duration_minutes ?? 60))
  );

  const slot = await validateOwnerBookingSlot(supabase, {
    businessId: params.businessId,
    scheduledDate: params.scheduledDate.trim(),
    startTimeHHmm: params.startTimeHHmm.trim(),
    durationMinutes,
    excludeBookingId: params.bookingId.trim(),
  });

  if (!slot.ok) {
    return {
      ok: false,
      error: ownerBookingSlotValidationMessage(slot.code),
      httpStatus: 409,
    };
  }

  const { data: updated, error: updateErr } = await db
    .from(TABLE)
    .update({
      scheduled_date: params.scheduledDate.trim(),
      start_time: params.startTimeHHmm.trim().slice(0, 5),
    })
    .eq('id', params.bookingId.trim())
    .eq('business_id', params.businessId)
    .eq('status', 'confirmed')
    .select()
    .maybeSingle();

  if (updateErr) {
    console.error('[rescheduleBookingForOwner] update', updateErr);
    return {
      ok: false,
      error: 'Could not save the new time. Please try again.',
      httpStatus: 500,
    };
  }

  if (!updated) {
    return {
      ok: false,
      error: 'That booking is no longer confirmed or was removed.',
      httpStatus: 409,
    };
  }

  return { ok: true, row: updated as BookingRow };
}
