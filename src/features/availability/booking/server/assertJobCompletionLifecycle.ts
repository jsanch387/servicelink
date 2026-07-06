/**
 * Shared lifecycle gates for Complete sheet, Tap to Pay, and job_completed.
 * Only requires an active (confirmed, not yet completed) booking — no in_progress
 * or work_handoff step.
 */

export interface JobCompletionLifecycleReject {
  httpStatus: number;
  error: string;
}

interface BookingLifecycleRow {
  status: string | null;
  job_status: string | null;
}

/**
 * Returns a reject object when the booking is not ready for payment collection
 * or job completion. Caller handles already-completed bookings separately when
 * idempotent retry semantics are needed.
 */
export function rejectJobCompletionLifecycle(
  booking: BookingLifecycleRow
): JobCompletionLifecycleReject | null {
  const bookingStatus = (booking.status ?? '').trim();
  const jobStatus = (booking.job_status ?? '').trim();

  if (bookingStatus === 'completed' || jobStatus === 'completed') {
    return { httpStatus: 409, error: 'This booking is already completed.' };
  }

  if (bookingStatus !== 'confirmed') {
    return {
      httpStatus: 409,
      error: 'Only confirmed appointments can be updated.',
    };
  }

  return null;
}
