import { describe, expect, it } from 'vitest';
import { rejectJobCompletionLifecycle } from '../server/assertJobCompletionLifecycle';

describe('rejectJobCompletionLifecycle', () => {
  const ready = {
    status: 'confirmed',
    job_status: 'not_started',
  };

  it('allows any confirmed booking that is not yet completed', () => {
    expect(rejectJobCompletionLifecycle(ready)).toBeNull();
    expect(
      rejectJobCompletionLifecycle({ ...ready, job_status: 'on_the_way' })
    ).toBeNull();
    expect(
      rejectJobCompletionLifecycle({ ...ready, job_status: 'in_progress' })
    ).toBeNull();
  });

  it('rejects when the booking is already completed', () => {
    expect(
      rejectJobCompletionLifecycle({
        status: 'completed',
        job_status: 'completed',
      })
    ).toEqual({
      httpStatus: 409,
      error: 'This booking is already completed.',
    });
  });

  it('rejects when the booking is not confirmed', () => {
    expect(
      rejectJobCompletionLifecycle({
        status: 'cancelled',
        job_status: 'not_started',
      })
    ).toEqual({
      httpStatus: 409,
      error: 'Only confirmed appointments can be updated.',
    });
  });
});
