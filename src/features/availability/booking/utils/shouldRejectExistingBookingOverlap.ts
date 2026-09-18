/**
 * Public customers cannot take a slot that already has a job.
 * Owner create and owner reschedule may stack jobs on purpose.
 */
export function shouldRejectExistingBookingOverlap(
  allowOverlap: boolean
): boolean {
  return !allowOverlap;
}
