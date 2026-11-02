import { describe, expect, it } from 'vitest';

import { canChangeBookingAssignee } from '../utils/canChangeBookingAssignee';

describe('canChangeBookingAssignee', () => {
  it('allows confirmed', () => {
    expect(canChangeBookingAssignee('confirmed')).toBe(true);
  });

  it('locks completed and cancelled', () => {
    expect(canChangeBookingAssignee('completed')).toBe(false);
    expect(canChangeBookingAssignee('cancelled')).toBe(false);
  });
});
