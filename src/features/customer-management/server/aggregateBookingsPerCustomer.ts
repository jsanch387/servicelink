/**
 * Builds per-customer metrics from V2 `bookings` rows (linked by `customer_id`).
 * Used when listing customers for the dashboard.
 *
 * Only **confirmed** and **completed** bookings count toward visits, revenue, and
 * “last booking” service / add-ons. Cancelled rows are ignored for aggregates.
 */

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
  lastScheduledDate: string;
  lastServiceName: string;
  lastServicePriceCents: number;
  lastAddonNames: string[];
  lastAddOnDetails: { name: string; priceCents: number }[];
  lifecycle: 'new' | 'returning';
}

function countsTowardVisitsAndRevenue(status: string): boolean {
  return status === 'confirmed' || status === 'completed';
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

/** Sort key: latest scheduled slot first (date + time). */
function sortKey(b: BookingRowForCustomerMetrics): string {
  const time = (b.start_time ?? '00:00:00').trim().slice(0, 8);
  return `${b.scheduled_date}T${time.padEnd(8, '0')}`;
}

/**
 * Map: `customer_id` → metrics. Only customers with at least one
 * confirmed/completed booking appear in the map.
 */
export function aggregateBookingsPerCustomer(
  rows: BookingRowForCustomerMetrics[]
): Map<string, CustomerBookingMetrics> {
  const byCustomer = new Map<string, BookingRowForCustomerMetrics[]>();

  for (const row of rows) {
    if (!row.customer_id?.trim()) {
      continue;
    }
    const id = row.customer_id.trim();
    const list = byCustomer.get(id) ?? [];
    list.push(row);
    byCustomer.set(id, list);
  }

  const out = new Map<string, CustomerBookingMetrics>();

  for (const [customerId, list] of byCustomer) {
    const counting = list.filter(b => countsTowardVisitsAndRevenue(b.status));
    if (counting.length === 0) {
      continue;
    }

    let totalSpentCents = 0;
    for (const b of counting) {
      const base = b.service_price_cents ?? 0;
      totalSpentCents += base + addonTotalCents(b.addon_details);
    }

    const latest = counting.reduce((a, b) => (sortKey(b) > sortKey(a) ? b : a));

    const lastAddonNames = addonNamesFromDetails(latest.addon_details);
    const lastAddOnDetails = addonDetailsFromDetails(latest.addon_details);

    out.set(customerId, {
      totalVisits: counting.length,
      totalSpentCents,
      lastScheduledDate: latest.scheduled_date,
      lastServiceName: latest.service_name?.trim() || '—',
      lastServicePriceCents: latest.service_price_cents ?? 0,
      lastAddonNames,
      lastAddOnDetails,
      lifecycle: counting.length > 1 ? 'returning' : 'new',
    });
  }

  return out;
}
