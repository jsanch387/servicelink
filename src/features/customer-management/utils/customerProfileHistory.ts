import type {
  CustomerRecord,
  CustomerVisit,
} from '@/features/customer-management/types';
import { customerVisitServiceLabel } from '@/features/customer-management/utils/customerVisitServiceLabel';

/** Service history shows the next appointment, then past visits, up to this many rows. */
export const CUSTOMER_PROFILE_HISTORY_LIMIT = 3;

export function upcomingHistoryVisit(
  customer: CustomerRecord
): CustomerVisit | null {
  if (!customer.nextAppointmentDate) return null;
  const addonTotal = (customer.nextAppointmentAddOnDetails ?? []).reduce(
    (sum, addon) => sum + addon.price,
    0
  );
  const servicePrice = customer.nextAppointmentServicePrice;
  return {
    id: `${customer.id}:next`,
    scheduledDate: customer.nextAppointmentDate,
    serviceName: customerVisitServiceLabel(
      customer.nextAppointmentService?.trim() || 'Appointment'
    ),
    price: typeof servicePrice === 'number' ? servicePrice + addonTotal : null,
  };
}

export function customerProfileHistoryRows(
  customer: CustomerRecord,
  visits: CustomerVisit[],
  limit = CUSTOMER_PROFILE_HISTORY_LIMIT
): CustomerVisit[] {
  const upcoming = upcomingHistoryVisit(customer);
  const rows = upcoming ? [upcoming, ...visits] : visits;
  return rows.slice(0, Math.max(0, limit));
}
