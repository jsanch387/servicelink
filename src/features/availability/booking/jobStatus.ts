/**
 * On-site fulfillment state of a booking, independent of `bookings.status`
 * (confirmed | completed | cancelled). Mirrors the `bookings.job_status` column
 * check constraint. See migration `002_bookings_job_status.sql`.
 */

export const JOB_STATUSES = [
  'not_started',
  'on_the_way',
  'in_progress',
  'completed',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/** Human-readable label for messages/errors, e.g. "in progress". */
export function jobStatusLabel(status: JobStatus): string {
  return status.replace(/_/g, ' ');
}
