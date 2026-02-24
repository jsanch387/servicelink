/**
 * Availability feature – V2 (availability) bookings: create and list.
 * Used by API routes only. Do not import from client components.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  mapBookingRowToDisplay,
  type BookingRow,
} from '../booking/dashboard/utils/mapBookingRowToDisplay';
import type { CustomerFormData } from '../booking/types';

const TABLE = 'bookings';

export interface CreateBookingPayload {
  business_id: string;
  business_slug: string | null;
  service_id: string | null;
  service_name: string;
  service_price_cents: number | null;
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
  customer_notes: string | null;
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
  | 'duration_minutes'
  | 'scheduled_date'
  | 'start_time'
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
    customer_notes: c.notes?.trim() || null,
  };
}

/**
 * Inserts one booking row. Uses admin/service client so RLS does not block insert.
 * Caller must validate slot and resolve business by slug before calling.
 */
export async function createBooking(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    businessSlug: string;
    serviceId?: string;
    serviceName: string;
    servicePriceCents?: number;
    durationMinutes: number;
    scheduledDate: string;
    startTime: string;
    customer: CustomerFormData;
  }
): Promise<{ id: string }> {
  const row: CreateBookingPayload = {
    business_id: payload.businessId,
    business_slug: payload.businessSlug || null,
    service_id: payload.serviceId ?? null,
    service_name: payload.serviceName.trim(),
    service_price_cents: payload.servicePriceCents ?? null,
    duration_minutes: payload.durationMinutes,
    scheduled_date: payload.scheduledDate,
    start_time: payload.startTime,
    ...mapCustomerToRow(payload.customer),
  };

  const { data, error } = await (supabase as any)
    .from(TABLE)
    .insert(row)
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return { id: data.id };
}

/**
 * Lists all bookings for a business (owner view). Use with authenticated
 * client so RLS allows SELECT for their business_id.
 */
export async function listBookingsForBusiness(
  supabase: SupabaseClient,
  businessId: string
): Promise<ReturnType<typeof mapBookingRowToDisplay>[]> {
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
  return rows.map(mapBookingRowToDisplay);
}

export type BookingStatusUpdate = 'completed' | 'cancelled';

/**
 * Updates a booking's status. Use with authenticated client; RLS ensures
 * only the business owner can update. Returns the updated row or null if
 * not found / not allowed.
 */
export async function updateBookingStatus(
  supabase: SupabaseClient,
  bookingId: string,
  status: BookingStatusUpdate
): Promise<BookingRow | null> {
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
