import type { CustomerMaintenanceEnrollmentSummary } from '@/features/customer-management/types';
import { hasMaintenanceAnchorScheduled } from '@/features/maintenance/server/hasMaintenanceAnchorScheduled';
import { maintenanceEnrollmentPaidWithCard } from '@/features/maintenance/server/maintenanceEnrollmentPaymentStatus';

/** e.g. "Thursday, May 15, 2026" — `isoDate` is `YYYY-MM-DD`. */
function formatMaintenanceEnrollmentDateLong(isoDate: string): string {
  const trimmed = isoDate.trim();
  const d = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(d.getTime())) return trimmed;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** `HH:mm` → e.g. "10:00 AM" */
function formatTime12FromHHmm(hhmm: string): string {
  const trimmed = hhmm.trim().slice(0, 5);
  const [hs, ms] = trimmed.split(':');
  const h = parseInt(hs ?? '0', 10);
  const m = parseInt(ms ?? '0', 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return trimmed;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return m === 0
    ? `${h12} ${ampm}`
    : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export type CustomerMaintenancePlanChipVariant =
  | 'confirmed'
  | 'pending'
  | 'cancelled';

/** Row badge next to “Maintenance plan” title in customer detail. */
export function customerMaintenancePlanChipVariant(
  e: CustomerMaintenanceEnrollmentSummary
): CustomerMaintenancePlanChipVariant {
  if (e.status === 'cancelled') return 'cancelled';
  if (e.status === 'accepted') return 'confirmed';
  return 'pending';
}

export function customerMaintenanceEnrollmentCardSubtitle(
  e: CustomerMaintenanceEnrollmentSummary
): string {
  if (e.status === 'cancelled') return 'Cancelled';
  if (e.status === 'accepted') {
    if (maintenanceEnrollmentPaidWithCard(e.paymentStatus)) {
      return 'Paid · card';
    }
    if (e.paymentStatus === 'pay_in_person') return 'Confirmed · pay in person';
    return 'Confirmed';
  }
  if (e.status === 'enrolled_pending_customer') return 'Waiting on customer';
  return e.status.replace(/_/g, ' ') || 'Maintenance';
}

export function customerMaintenanceAnchorDisplay(
  e: CustomerMaintenanceEnrollmentSummary
): string {
  if (
    hasMaintenanceAnchorScheduled({
      anchor_date: e.anchorDate,
      anchor_time: e.anchorTime,
    })
  ) {
    const d = String(e.anchorDate ?? '').trim();
    const t = String(e.anchorTime ?? '')
      .trim()
      .slice(0, 5);
    return `${formatMaintenanceEnrollmentDateLong(d)} · ${formatTime12FromHHmm(t)}`;
  }
  return 'Not set yet';
}
