import type { CustomerVisit } from '@/features/customer-management/types';
import { bookingSlotSortKey } from '@/features/customer-management/utils/bookingSlotLocal';
import { customerVisitServiceLabel } from '@/features/customer-management/utils/customerVisitServiceLabel';
import { addonTotalCents } from './aggregateBookingsPerCustomer';

/** Rows shown on the customer profile service history card. */
export const CUSTOMER_SERVICE_HISTORY_LIMIT = 3;

export interface CustomerVisitBookingRow {
  id: string;
  service_name: string | null;
  service_price_cents: number | null;
  addon_details: unknown;
  job_details?: unknown;
  scheduled_date: string;
  start_time: string;
  status: string;
}

/**
 * Completed bookings only, newest slot first, capped for the profile card.
 * Price matches lifetime spend: service plus add-ons.
 */
export function mapCompletedCustomerVisits(
  rows: CustomerVisitBookingRow[],
  limit = CUSTOMER_SERVICE_HISTORY_LIMIT
): CustomerVisit[] {
  return rows
    .filter(row => row.status === 'completed' && row.id.trim())
    .sort((a, b) => {
      const bySlot = bookingSlotSortKey(
        b.scheduled_date,
        b.start_time
      ).localeCompare(bookingSlotSortKey(a.scheduled_date, a.start_time));
      if (bySlot !== 0) return bySlot;
      return b.id.localeCompare(a.id);
    })
    .slice(0, limit)
    .map(row => {
      const cents =
        (row.service_price_cents ?? 0) + addonTotalCents(row.addon_details);
      const serviceName = customerVisitServiceLabel(
        row.service_name,
        row.job_details
      );
      return {
        id: row.id,
        scheduledDate: row.scheduled_date,
        serviceName,
        price: cents / 100,
      };
    });
}
