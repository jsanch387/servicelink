import type { CustomerRecord } from '@/features/customer-management/types';
import { normalizeEmailForLookup } from '@/features/customer-management/server/normalizeCustomerContact';
import { daysSinceDateString } from '@/features/customer-management/utils/daysSinceDateString';
import type { CustomerBookingMetrics } from '@/features/customer-management/server/aggregateBookingsPerCustomer';
import type { CustomerDbRow } from './customerDbRow';

/**
 * Maps `customers` row + optional booking aggregates → UI model.
 * `note` is **profile-only** (`customers.notes`), never booking-specific text.
 */
export function mapCustomerRowToRecord(
  row: CustomerDbRow,
  metrics?: CustomerBookingMetrics | null
): CustomerRecord {
  const createdDay = row.created_at.slice(0, 10);
  const emailRaw = row.email_normalized ?? row.email ?? '';
  const email = emailRaw ? normalizeEmailForLookup(emailRaw) : '';

  if (metrics && metrics.totalVisits > 0) {
    return {
      id: row.id,
      name: row.full_name,
      phone: row.phone ?? '',
      email,
      lastService: metrics.lastServiceName,
      lastServicePrice: metrics.lastServicePriceCents / 100,
      lastBookingAddOns:
        metrics.lastAddonNames.length > 0 ? metrics.lastAddonNames : undefined,
      lastBookingAddOnDetails:
        metrics.lastAddOnDetails.length > 0
          ? metrics.lastAddOnDetails.map(addon => ({
              name: addon.name,
              price: addon.priceCents / 100,
            }))
          : undefined,
      lastBookingDate: metrics.lastScheduledDate,
      lastBookingDaysAgo: daysSinceDateString(metrics.lastScheduledDate),
      totalVisits: metrics.totalVisits,
      totalSpent: metrics.totalSpentCents / 100,
      status: metrics.lifecycle,
      note: row.notes ?? '',
    };
  }

  return {
    id: row.id,
    name: row.full_name,
    phone: row.phone ?? '',
    email,
    lastService: '—',
    lastBookingDate: createdDay,
    lastBookingDaysAgo: daysSinceDateString(createdDay),
    totalVisits: 0,
    totalSpent: 0,
    status: 'new',
    note: row.notes ?? '',
  };
}
