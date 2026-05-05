import {
  ownerBookingSlotValidationMessage,
  type OwnerBookingSlotValidationCode,
} from '@/features/availability/booking/server/validateOwnerBookingSlot';
import { describe, expect, it } from 'vitest';

describe('ownerBookingSlotValidationMessage', () => {
  const codes: OwnerBookingSlotValidationCode[] = [
    'availability_not_configured',
    'outside_weekly_hours',
    'time_off_conflict',
    'existing_booking_conflict',
    'load_bookings_failed',
  ];

  it('returns a non-empty user-facing string for every code', () => {
    for (const code of codes) {
      const msg = ownerBookingSlotValidationMessage(code);
      expect(msg.length).toBeGreaterThan(10);
      expect(msg).not.toMatch(/undefined|null/i);
    }
  });

  it('mentions the constraint for common failure modes', () => {
    expect(ownerBookingSlotValidationMessage('outside_weekly_hours')).toMatch(
      /hours|slot|working/i
    );
    expect(
      ownerBookingSlotValidationMessage('existing_booking_conflict')
    ).toMatch(/booked|slot/i);
  });
});
