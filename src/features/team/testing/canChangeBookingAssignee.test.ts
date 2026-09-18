import { describe, expect, it } from 'vitest';

import { canChangeBookingAssignee } from '../utils/canChangeBookingAssignee';

describe('canChangeBookingAssignee', () => {
  it('allows confirmed and cancelled', () => {
    expect(canChangeBookingAssignee('confirmed')).toBe(true);
    expect(canChangeBookingAssignee('cancelled')).toBe(true);
  });

  it('locks completed', () => {
    expect(canChangeBookingAssignee('completed')).toBe(false);
  });
});
