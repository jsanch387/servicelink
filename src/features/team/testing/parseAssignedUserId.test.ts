import { describe, expect, it } from 'vitest';

import { parseAssignedUserId } from '../utils/parseAssignedUserId';

describe('parseAssignedUserId', () => {
  it('treats null and blank as unassigned', () => {
    expect(parseAssignedUserId(null)).toEqual({
      ok: true,
      assignedUserId: null,
    });
    expect(parseAssignedUserId('')).toEqual({
      ok: true,
      assignedUserId: null,
    });
    expect(parseAssignedUserId('   ')).toEqual({
      ok: true,
      assignedUserId: null,
    });
  });

  it('keeps a trimmed user id', () => {
    expect(parseAssignedUserId('  user-1  ')).toEqual({
      ok: true,
      assignedUserId: 'user-1',
    });
  });

  it('rejects non-strings', () => {
    expect(parseAssignedUserId(1)).toEqual({
      ok: false,
      error: 'assignedUserId must be a user id or null.',
    });
  });
});
