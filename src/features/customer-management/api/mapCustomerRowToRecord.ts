import type { CustomerBookingMetrics } from '@/features/customer-management/server/aggregateBookingsPerCustomer';
import { normalizeEmailForLookup } from '@/features/customer-management/server/normalizeCustomerContact';
import type {
  CustomerMaintenanceEnrollmentSummary,
  CustomerRecord,
} from '@/features/customer-management/types';
import {
  daysSinceDateString,
  daysUntilDateString,
} from '@/features/customer-management/utils/daysSinceDateString';
import type { CustomerDbRow } from './customerDbRow';

/**
 * Maps `customers` row + optional booking aggregates → UI model.
 * `note` is **profile-only** (`customers.notes`), never booking-specific text.
 */
export function mapCustomerRowToRecord(
  row: CustomerDbRow,
  metrics?: CustomerBookingMetrics | null,
  maintenance?: CustomerMaintenanceEnrollmentSummary | null
): CustomerRecord {
  const emailRaw = row.email_normalized ?? row.email ?? '';
  const email = emailRaw ? normalizeEmailForLookup(emailRaw) : '';

  if (metrics) {
    const lastVisitDate = metrics.lastVisitScheduledDate;
    const nextAppointmentDate = metrics.nextAppointmentScheduledDate;

    const nextAddOnDetails =
      metrics.nextAppointmentAddOnDetails.length > 0
        ? metrics.nextAppointmentAddOnDetails.map(addon => ({
            name: addon.name,
            price: addon.priceCents / 100,
          }))
        : undefined;

    return {
      id: row.id,
      name: row.full_name,
      phone: row.phone ?? '',
      email,
      lastService: metrics.lastVisitServiceName,
      lastServicePrice:
        metrics.lastVisitScheduledDate !== null
          ? metrics.lastVisitServicePriceCents / 100
          : undefined,
      lastBookingAddOns:
        metrics.lastVisitAddonNames.length > 0
          ? metrics.lastVisitAddonNames
          : undefined,
      lastBookingAddOnDetails:
        metrics.lastVisitAddOnDetails.length > 0
          ? metrics.lastVisitAddOnDetails.map(addon => ({
              name: addon.name,
              price: addon.priceCents / 100,
            }))
          : undefined,
      lastVisitDate,
      lastVisitDaysAgo: lastVisitDate
        ? daysSinceDateString(lastVisitDate)
        : null,
      nextAppointmentDate,
      nextAppointmentDaysUntil: nextAppointmentDate
        ? daysUntilDateString(nextAppointmentDate)
        : null,
      nextAppointmentService:
        nextAppointmentDate && metrics.nextAppointmentServiceName
          ? metrics.nextAppointmentServiceName
          : undefined,
      nextAppointmentServicePrice:
        nextAppointmentDate &&
        typeof metrics.nextAppointmentServicePriceCents === 'number'
          ? metrics.nextAppointmentServicePriceCents / 100
          : undefined,
      nextAppointmentAddOns:
        metrics.nextAppointmentAddonNames.length > 0
          ? metrics.nextAppointmentAddonNames
          : undefined,
      nextAppointmentAddOnDetails: nextAddOnDetails,
      totalVisits: metrics.totalVisits,
      totalSpent: metrics.totalSpentCents / 100,
      status: metrics.lifecycle,
      note: row.notes ?? '',
      maintenanceEnrollment: maintenance ?? null,
    };
  }

  return {
    id: row.id,
    name: row.full_name,
    phone: row.phone ?? '',
    email,
    lastService: '—',
    lastVisitDate: null,
    lastVisitDaysAgo: null,
    nextAppointmentDate: null,
    nextAppointmentDaysUntil: null,
    totalVisits: 0,
    totalSpent: 0,
    status: 'new',
    note: row.notes ?? '',
    maintenanceEnrollment: maintenance ?? null,
  };
}
