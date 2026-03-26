import { daysUntilDateString } from '@/features/customer-management/utils/daysSinceDateString';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Whole calendar days until a date → short relative label (local calendar). */
export function formatNextInDays(daysUntil: number): string {
  if (daysUntil <= 0) {
    return 'Today';
  }
  if (daysUntil === 1) {
    return 'Tomorrow';
  }
  return `in ${daysUntil} days`;
}

/**
 * Label for “how soon” the next booking is. Uses `scheduledDate` (YYYY-MM-DD) with
 * the **current environment’s** local calendar so dashboard clients see Today/Tomorrow
 * aligned with their timezone; falls back to server-computed days if the date is missing.
 */
export function formatNextAppointmentRelativeDay(
  scheduledDate: string | null | undefined,
  serverDaysUntil: number | null | undefined
): string {
  const trimmed = scheduledDate?.trim();
  if (trimmed && ISO_DATE_RE.test(trimmed)) {
    return formatNextInDays(daysUntilDateString(trimmed));
  }
  if (typeof serverDaysUntil === 'number' && Number.isFinite(serverDaysUntil)) {
    return formatNextInDays(serverDaysUntil);
  }
  return '—';
}
