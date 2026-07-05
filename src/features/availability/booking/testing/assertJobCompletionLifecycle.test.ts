import { describe, expect, it } from 'vitest';
import { rejectJobCompletionLifecycle } from '../server/assertJobCompletionLifecycle';

describe('rejectJobCompletionLifecycle', () => {
  const ready = {
    status: 'confirmed',
    job_status: 'in_progress',
    work_handoff_status: 'notified',
  };

  it('allows confirmed in_progress bookings with handoff set', () => {
    expect(rejectJobCompletionLifecycle(ready)).toBeNull();
    expect(
      rejectJobCompletionLifecycle(
        { ...ready, work_handoff_status: 'skipped' },
        { forPaymentCollection: true }
      )
    ).toBeNull();
  });

  it('rejects when job is not in progress', () => {
    expect(
      rejectJobCompletionLifecycle({ ...ready, job_status: 'on_the_way' })
    ).toEqual({
      httpStatus: 409,
      error: 'Mark work done before completing this job.',
    });
  });

  it('rejects when handoff was never set', () => {
    expect(
      rejectJobCompletionLifecycle({ ...ready, work_handoff_status: null })
    ).toEqual({
      httpStatus: 409,
      error: 'Mark work done before completing this job.',
    });
  });

  it('uses payment-specific copy for tap to pay preconditions', () => {
    expect(
      rejectJobCompletionLifecycle(
        { ...ready, work_handoff_status: null },
        { forPaymentCollection: true }
      )
    ).toEqual({
      httpStatus: 409,
      error: 'Mark work done before collecting payment.',
    });
  });
});
