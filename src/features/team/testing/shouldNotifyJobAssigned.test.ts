import { describe, expect, it } from 'vitest';

import { shouldNotifyJobAssigned } from '../utils/shouldNotifyJobAssigned';

describe('shouldNotifyJobAssigned', () => {
  it('notifies when someone else is put on the job', () => {
    expect(
      shouldNotifyJobAssigned({
        previousAssignedUserId: null,
        nextAssignedUserId: 'jose',
        actorUserId: 'owner',
      })
    ).toBe(true);
  });

  it('skips self-assign, unassign, and no change', () => {
    expect(
      shouldNotifyJobAssigned({
        previousAssignedUserId: null,
        nextAssignedUserId: 'jose',
        actorUserId: 'jose',
      })
    ).toBe(false);
    expect(
      shouldNotifyJobAssigned({
        previousAssignedUserId: 'jose',
        nextAssignedUserId: null,
        actorUserId: 'owner',
      })
    ).toBe(false);
    expect(
      shouldNotifyJobAssigned({
        previousAssignedUserId: 'jose',
        nextAssignedUserId: 'jose',
        actorUserId: 'owner',
      })
    ).toBe(false);
  });
});
