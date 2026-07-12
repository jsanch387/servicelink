/**
 * Maps a bookings table row (snake_case) to AvailabilityBookingDisplay for the dashboard.
 * Used by the list-bookings API and any server-side listing.
 */

import { normalizeWallClockHm } from '@/features/availability/types/blockTime';
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
  customer_email: string | null;
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
  customer_id: string | null;
  service_location_type?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  discount_source?: string | null;
  discount_promo_code_id?: string | null;
  discount_sale_id?: string | null;
  discount_type?: string | null;
  discount_value?: number | null;
  discount_label?: string | null;
  discount_cents?: number | null;
  subtotal_cents?: number | null;
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

  const discountCents =
    typeof row.discount_cents === 'number' &&
    Number.isFinite(row.discount_cents)
      ? Math.max(0, Math.round(row.discount_cents))
      : 0;
  const rawDiscountSource = row.discount_source;
  const discountSource: 'sale' | 'promo' | null =
    rawDiscountSource === 'sale' || rawDiscountSource === 'promo'
      ? rawDiscountSource
      : null;
  const discountLabel = row.discount_label?.trim() || '';
  const lineSubtotal =
    (row.service_price_cents ?? 0) +
    addonDetails.reduce((sum, a) => sum + (a.priceCents ?? 0), 0);
  const snapshotSubtotal =
    typeof row.subtotal_cents === 'number' &&
    Number.isFinite(row.subtotal_cents)
      ? Math.max(0, Math.round(row.subtotal_cents))
      : lineSubtotal;

  const discount: AvailabilityBookingDisplay['discount'] =
    discountSource && discountCents > 0 && discountLabel
      ? {
          source: discountSource,
          label: discountLabel,
          discountCents,
          subtotalCents: snapshotSubtotal,
        }
      : null;

  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? '',
    customerEmail: row.customer_email ?? '',
    customerVehicleYear: row.customer_vehicle_year ?? undefined,
    customerVehicleMake: row.customer_vehicle_make ?? undefined,
    customerVehicleModel: row.customer_vehicle_model ?? undefined,
    serviceName: row.service_name,
    serviceDurationMinutes: row.duration_minutes,
    servicePriceCents: row.service_price_cents ?? 0,
    addonDetails,
    discount,
    date: row.scheduled_date,
    time: formatTimeDisplay(row.start_time ?? ''),
    startTimeHHmm:
      normalizeWallClockHm(
        String(row.start_time ?? '')
          .trim()
          .slice(0, 5)
      ) ?? '09:00',
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
