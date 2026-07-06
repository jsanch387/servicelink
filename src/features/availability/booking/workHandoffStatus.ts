/**
 * Owner handoff state while `job_status = in_progress` (Done / Skip step).
 * Mirrors `bookings.work_handoff_status` — see migration
 * `003_bookings_work_handoff_status.sql`.
 */

export const WORK_HANDOFF_STATUSES = ['notified', 'skipped'] as const;

export type WorkHandoffStatus = (typeof WORK_HANDOFF_STATUSES)[number];

export function isWorkHandoffStatus(
  value: string | null | undefined
): value is WorkHandoffStatus {
  return value === 'notified' || value === 'skipped';
}

/** When Done/Skip was not used, treat completion as skipped for response fields. */
export function resolveWorkHandoffStatusForCompletion(
  value: string | null | undefined
): WorkHandoffStatus {
  return isWorkHandoffStatus(value) ? value : 'skipped';
}
