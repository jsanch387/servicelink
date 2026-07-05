/**
 * Shared lifecycle gates for Complete sheet, Tap to Pay, and job_completed.
 */

import {
  isWorkHandoffStatus,
  type WorkHandoffStatus,
} from '../workHandoffStatus';

export const JOB_COMPLETION_REQUIRED_JOB_STATUS = 'in_progress' as const;

export interface JobCompletionLifecycleReject {
  httpStatus: number;
  error: string;
}

interface BookingLifecycleRow {
  status: string | null;
  job_status: string | null;
  work_handoff_status: string | null;
}

function paymentLifecycleMessage(): string {
  return 'Mark work done before collecting payment.';
}

function completionLifecycleMessage(): string {
  return 'Mark work done before completing this job.';
}

/**
 * Returns a reject object when the booking is not ready for payment collection
 * or job completion. Caller handles already-completed bookings separately when
 * idempotent retry semantics are needed.
 */
export function rejectJobCompletionLifecycle(
  booking: BookingLifecycleRow,
  options?: { forPaymentCollection?: boolean }
): JobCompletionLifecycleReject | null {
  const bookingStatus = (booking.status ?? '').trim();
  const jobStatus = (booking.job_status ?? '').trim();
  const lifecycleMessage = options?.forPaymentCollection
    ? paymentLifecycleMessage()
    : completionLifecycleMessage();

  if (bookingStatus === 'completed' || jobStatus === 'completed') {
    return { httpStatus: 409, error: 'This booking is already completed.' };
  }

  if (bookingStatus !== 'confirmed') {
    return {
      httpStatus: 409,
      error: options?.forPaymentCollection
        ? 'Only confirmed appointments can collect payment.'
        : 'Only confirmed appointments can be updated.',
    };
  }

  if (jobStatus !== JOB_COMPLETION_REQUIRED_JOB_STATUS) {
    return { httpStatus: 409, error: lifecycleMessage };
  }

  if (!isWorkHandoffStatus(booking.work_handoff_status)) {
    return { httpStatus: 409, error: lifecycleMessage };
  }

  return null;
}

export function requiredWorkHandoffStatus(
  value: string | null | undefined
): WorkHandoffStatus {
  if (!isWorkHandoffStatus(value)) {
    throw new Error('requiredWorkHandoffStatus called without valid handoff');
  }
  return value;
}
