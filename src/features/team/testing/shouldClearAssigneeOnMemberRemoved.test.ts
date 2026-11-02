import { describe, expect, it } from 'vitest';

import { shouldClearAssigneeOnMemberRemoved } from '../utils/shouldClearAssigneeOnMemberRemoved';

describe('shouldClearAssigneeOnMemberRemoved', () => {
  it('clears upcoming confirmed jobs', () => {
    expect(
      shouldClearAssigneeOnMemberRemoved({
        status: 'confirmed',
        scheduledDate: '2026-09-18',
        asOf: '2026-09-17',
      })
    ).toBe(true);
  });

  it('keeps completed, cancelled, and past confirmed jobs', () => {
    expect(
      shouldClearAssigneeOnMemberRemoved({
        status: 'completed',
        scheduledDate: '2026-09-18',
        asOf: '2026-09-17',
      })
    ).toBe(false);
    expect(
      shouldClearAssigneeOnMemberRemoved({
        status: 'cancelled',
        scheduledDate: '2026-09-18',
        asOf: '2026-09-17',
      })
    ).toBe(false);
    expect(
      shouldClearAssigneeOnMemberRemoved({
        status: 'confirmed',
        scheduledDate: '2026-09-10',
        asOf: '2026-09-17',
      })
    ).toBe(false);
  });
});
