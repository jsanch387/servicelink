/**
 * Creates a V2 `bookings` row (and upserts `customers`) from an approved quote.
 * Server-only; use with the admin Supabase client.
 */

import { createBooking } from '@/features/availability/services/bookingService';
import { normalizePhoneForLookup } from '@/features/customer-management/server/normalizeCustomerContact';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type QuoteRowForApprovedBooking = {
  id: string;
  business_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_street_address: string | null;
  customer_unit_apt: string | null;
  customer_city: string | null;
  customer_state: string | null;
  customer_zip: string | null;
  /** Legacy single-line address when structured fields are empty. */
  service_address: string | null;
  service_name: string | null;
  price_cents: number | null;
  duration_minutes: number | null;
  scheduled_date: string | null;
  scheduled_start_time: string | null;
  note: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
};

/** Postgres `time` often serializes as `HH:mm:ss`; templates expect `HH:mm`. */
export function quoteStartTimeToHHmm(t: string | null | undefined): string {
  if (!t?.trim()) {
    return '09:00';
  }
  const m = t.trim().match(/^(\d{1,2}:\d{2})/);
  return m ? m[1]! : t.trim().slice(0, 5);
}

export async function createBookingFromApprovedQuote(
  supabase: SupabaseClient<Database>,
  quote: QuoteRowForApprovedBooking,
  businessSlug: string
): Promise<{ bookingId: string }> {
  const scheduledDate = quote.scheduled_date?.trim();
  if (!scheduledDate) {
    throw new Error('Quote is missing scheduled_date');
  }

  const startTime = quoteStartTimeToHHmm(quote.scheduled_start_time);
  const durationMinutes = Math.max(1, quote.duration_minutes ?? 60);
  const phoneDigits = normalizePhoneForLookup(quote.customer_phone) ?? '';

  const serviceLabel = (quote.service_name?.trim() || 'Quoted service').slice(
    0,
    500
  );

  const street =
    quote.customer_street_address?.trim() ||
    quote.service_address?.trim() ||
    '';
  if (!street) {
    throw new Error('Quote is missing a service street address');
  }

  const customer = {
    fullName: quote.customer_name.trim(),
    email: quote.customer_email.trim(),
    phone: phoneDigits,
    streetAddress: street,
    unitApt: quote.customer_unit_apt?.trim() ?? '',
    city: quote.customer_city?.trim() ?? '',
    state: quote.customer_state?.trim() ?? '',
    zip: quote.customer_zip?.trim() ?? '',
    vehicleYear: quote.vehicle_year?.trim() ?? '',
    vehicleMake: quote.vehicle_make?.trim() ?? '',
    vehicleModel: quote.vehicle_model?.trim() ?? '',
    notes: quote.note?.trim() ?? '',
  };

  const { id: bookingId } = await createBooking(supabase, {
    businessId: quote.business_id,
    businessSlug: businessSlug.trim(),
    serviceName: serviceLabel,
    servicePriceCents: quote.price_cents ?? undefined,
    durationMinutes,
    scheduledDate,
    startTime,
    customer,
  });

  return { bookingId };
}
