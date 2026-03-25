/**
 * Builds per-customer metrics from V2 `bookings` rows (linked by `customer_id`).
 *
 * - **Visits** and **lifetime spent** use **`completed`** bookings only.
 * - **Last visit** line items = latest **`completed`** booking by scheduled slot.
 * - **Next appointment** = earliest **`confirmed`** booking whose slot is still in the future.
 * - **`cancelled`** rows are ignored.
 */

import {
  bookingSlotSortKey,
  isBookingSlotAfterNow,
} from '@/features/customer-management/utils/bookingSlotLocal';

export interface BookingRowForCustomerMetrics {
  customer_id: string;
  service_name: string;
  service_price_cents: number | null;
  addon_details: unknown;
  scheduled_date: string;
  start_time: string;
  status: string;
  created_at: string;
}

export interface CustomerBookingMetrics {
  totalVisits: number;
  totalSpentCents: number;
  lifecycle: 'new' | 'returning';

  lastVisitScheduledDate: string | null;
  lastVisitServiceName: string;
  lastVisitServicePriceCents: number;
  lastVisitAddonNames: string[];
  lastVisitAddOnDetails: { name: string; priceCents: number }[];

  nextAppointmentScheduledDate: string | null;
  nextAppointmentServiceName: string | null;
  nextAppointmentServicePriceCents: number | null;
  nextAppointmentAddonNames: string[];
  nextAppointmentAddOnDetails: { name: string; priceCents: number }[];
}

function addonTotalCents(details: unknown): number {
  if (!Array.isArray(details)) {
    return 0;
  }
  return details.reduce((sum, item) => {
    if (
      typeof item === 'object' &&
      item !== null &&
      'priceCents' in item &&
      typeof (item as { priceCents: unknown }).priceCents === 'number'
    ) {
      const n = (item as { priceCents: number }).priceCents;
      return sum + (Number.isFinite(n) ? n : 0);
    }
    return sum;
  }, 0);
}

function addonNamesFromDetails(details: unknown): string[] {
  if (!Array.isArray(details)) {
    return [];
  }
  return details
    .map(item => {
      if (
        typeof item === 'object' &&
        item !== null &&
        'name' in item &&
        typeof (item as { name: unknown }).name === 'string'
      ) {
        return (item as { name: string }).name.trim();
      }
      return '';
    })
    .filter(Boolean);
}

function addonDetailsFromDetails(
  details: unknown
): { name: string; priceCents: number }[] {
  if (!Array.isArray(details)) {
    return [];
  }

  return details
    .map(item => {
      if (typeof item !== 'object' || item === null) {
        return null;
      }

      const name =
        'name' in item && typeof (item as { name: unknown }).name === 'string'
          ? (item as { name: string }).name.trim()
          : '';
      const priceCents =
        'priceCents' in item &&
        typeof (item as { priceCents: unknown }).priceCents === 'number'
          ? (item as { priceCents: number }).priceCents
          : 0;

      if (!name) {
        return null;
      }

      return {
        name,
        priceCents: Number.isFinite(priceCents) ? priceCents : 0,
      };
    })
    .filter(
      (item): item is { name: string; priceCents: number } => item !== null
    );
}

function sortKey(b: BookingRowForCustomerMetrics): string {
  return bookingSlotSortKey(b.scheduled_date, b.start_time);
}

function pickLatest(rows: BookingRowForCustomerMetrics[]) {
  return rows.reduce((a, b) => (sortKey(b) > sortKey(a) ? b : a));
}

function pickEarliest(rows: BookingRowForCustomerMetrics[]) {
  return rows.reduce((a, b) => (sortKey(b) < sortKey(a) ? b : a));
}

/**
 * Map: `customer_id` → metrics. Customers appear if they have at least one
 * non-cancelled booking linked by `customer_id`.
 */
export function aggregateBookingsPerCustomer(
  rows: BookingRowForCustomerMetrics[]
): Map<string, CustomerBookingMetrics> {
  const byCustomer = new Map<string, BookingRowForCustomerMetrics[]>();

  for (const row of rows) {
    if (!row.customer_id?.trim()) {
      continue;
    }
    if (row.status === 'cancelled') {
      continue;
    }
    const id = row.customer_id.trim();
    const list = byCustomer.get(id) ?? [];
    list.push(row);
    byCustomer.set(id, list);
  }

  const out = new Map<string, CustomerBookingMetrics>();
  const now = new Date();

  for (const [customerId, list] of byCustomer) {
    const completed = list.filter(b => b.status === 'completed');
    const confirmed = list.filter(b => b.status === 'confirmed');

    let totalSpentCents = 0;
    for (const b of completed) {
      const base = b.service_price_cents ?? 0;
      totalSpentCents += base + addonTotalCents(b.addon_details);
    }
    const totalVisits = completed.length;

    let lastVisitScheduledDate: string | null = null;
    let lastVisitServiceName = '—';
    let lastVisitServicePriceCents = 0;
    let lastVisitAddonNames: string[] = [];
    let lastVisitAddOnDetails: { name: string; priceCents: number }[] = [];

    if (completed.length > 0) {
      const latest = pickLatest(completed);
      lastVisitScheduledDate = latest.scheduled_date;
      lastVisitServiceName = latest.service_name?.trim() || '—';
      lastVisitServicePriceCents = latest.service_price_cents ?? 0;
      lastVisitAddonNames = addonNamesFromDetails(latest.addon_details);
      lastVisitAddOnDetails = addonDetailsFromDetails(latest.addon_details);
    }

    const upcomingConfirmed = confirmed.filter(b =>
      isBookingSlotAfterNow(b.scheduled_date, b.start_time, now)
    );

    let nextAppointmentScheduledDate: string | null = null;
    let nextAppointmentServiceName: string | null = null;
    let nextAppointmentServicePriceCents: number | null = null;
    let nextAppointmentAddonNames: string[] = [];
    let nextAppointmentAddOnDetails: { name: string; priceCents: number }[] =
      [];

    if (upcomingConfirmed.length > 0) {
      const next = pickEarliest(upcomingConfirmed);
      nextAppointmentScheduledDate = next.scheduled_date;
      nextAppointmentServiceName = next.service_name?.trim() || null;
      nextAppointmentServicePriceCents = next.service_price_cents ?? null;
      nextAppointmentAddonNames = addonNamesFromDetails(next.addon_details);
      nextAppointmentAddOnDetails = addonDetailsFromDetails(next.addon_details);
    }

    out.set(customerId, {
      totalVisits,
      totalSpentCents,
      lifecycle: totalVisits > 1 ? 'returning' : 'new',
      lastVisitScheduledDate,
      lastVisitServiceName,
      lastVisitServicePriceCents,
      lastVisitAddonNames,
      lastVisitAddOnDetails,
      nextAppointmentScheduledDate,
      nextAppointmentServiceName,
      nextAppointmentServicePriceCents,
      nextAppointmentAddonNames,
      nextAppointmentAddOnDetails,
    });
  }

  return out;
}
