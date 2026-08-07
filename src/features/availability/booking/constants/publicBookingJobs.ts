/** Max jobs a customer can add on one public visit (UI + public API). */
export const PUBLIC_BOOKING_MAX_JOBS = 4;

export const PUBLIC_BOOKING_MAX_JOBS_MESSAGE =
  'You can add up to 4 services on one booking.';

/** Query flag: `/book?visit=1` loads the multi-job cart and schedule flow. */
export const PUBLIC_BOOKING_VISIT_QUERY = 'visit';

/**
 * Query flag: customer is appending another service to the current visit.
 * Fresh book starts (no flag) clear the visit cart so stale jobs don’t linger.
 */
export const PUBLIC_BOOKING_ADD_JOB_QUERY = 'addJob';

/**
 * Query flag: customer is editing the sole service on an in-progress visit
 * (back from calendar → service details). Keeps contact/schedule draft.
 */
export const PUBLIC_BOOKING_EDIT_VISIT_QUERY = 'editVisit';

export function isPublicBookingAddJobQuery(
  value: string | null | undefined
): boolean {
  return value === '1' || value === 'true';
}

export function isPublicBookingEditVisitQuery(
  value: string | null | undefined
): boolean {
  return value === '1' || value === 'true';
}
