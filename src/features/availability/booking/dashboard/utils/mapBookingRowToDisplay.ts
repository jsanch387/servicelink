/**
 * Maps a bookings table row (snake_case) to AvailabilityBookingDisplay for the dashboard.
 * Used by the list-bookings API and any server-side listing.
 */

import type { AvailabilityBookingDisplay } from '../types';

/** Raw row from bookings table (select *). */
export interface BookingRow {
  id: string;
  business_id: string;
  business_slug: string | null;
  service_id: string | null;
  service_name: string;
  service_price_cents: number | null;
  addon_details: { id: string; name: string; priceCents: number }[] | null;
  duration_minutes: number;
  scheduled_date: string;
  start_time: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_street_address: string | null;
  customer_unit_apt: string | null;
  customer_city: string | null;
  customer_state: string | null;
  customer_zip: string | null;
  customer_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/** Postgres time "HH:mm:ss" or "HH:mm" → "2:30 PM" */
function formatTimeDisplay(timeStr: string): string {
  const part = timeStr.trim().slice(0, 5);
  const [hStr, mStr] = part.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  const min = m === 0 ? '' : `:${m.toString().padStart(2, '0')}`;
  return `${h12}${min} ${ampm}`.trim();
}

export function mapBookingRowToDisplay(
  row: BookingRow
): AvailabilityBookingDisplay {
  const addonDetails = Array.isArray(row.addon_details)
    ? row.addon_details
    : [];
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? '',
    customerEmail: row.customer_email,
    serviceName: row.service_name,
    serviceDurationMinutes: row.duration_minutes,
    servicePriceCents: row.service_price_cents ?? 0,
    addonDetails,
    date: row.scheduled_date,
    time: formatTimeDisplay(row.start_time ?? ''),
    status: row.status as AvailabilityBookingDisplay['status'],
    address: {
      street: row.customer_street_address ?? '',
      unitApt: row.customer_unit_apt ?? undefined,
      city: row.customer_city ?? '',
      state: row.customer_state ?? '',
      zip: row.customer_zip ?? '',
    },
    notes: row.customer_notes ?? '',
    createdAt: row.created_at,
  };
}
