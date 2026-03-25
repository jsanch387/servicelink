import type { CustomerRecord } from '@/features/customer-management/types';
import { daysSinceDateString } from '@/features/customer-management/utils/daysSinceDateString';
import type { CustomerDbRow } from './customerDbRow';

/** Maps `customers` row → UI model. Booking aggregates can be filled in later from `bookings`. */
export function mapCustomerRowToRecord(row: CustomerDbRow): CustomerRecord {
  const createdDay = row.created_at.slice(0, 10);

  return {
    id: row.id,
    name: row.full_name,
    phone: row.phone ?? '',
    email: row.email ?? '',
    lastService: '—',
    lastBookingDate: createdDay,
    lastBookingDaysAgo: daysSinceDateString(createdDay),
    totalVisits: 0,
    totalSpent: 0,
    status: 'new',
    note: row.notes ?? '',
  };
}
