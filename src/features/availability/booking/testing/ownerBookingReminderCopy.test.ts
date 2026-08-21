import { describe, expect, it } from 'vitest';
import {
  OWNER_BOOKING_REMINDER_REFERENCE_ID,
  OWNER_BOOKING_REMINDER_REFERENCE_TYPE,
  ownerBookingReminderBody,
  ownerBookingReminderDedupeKey,
  ownerBookingReminderTitle,
} from '../server/ownerBookingReminderCopy';

describe('ownerBookingReminderCopy', () => {
  it('uses the upcoming-appointment headline', () => {
    expect(ownerBookingReminderTitle()).toBe('Upcoming appointment');
  });

  it('keeps the body generic', () => {
    expect(ownerBookingReminderBody()).toBe(
      'You have an appointment coming up.'
    );
  });

  it('routes tap to the bookings calendar screen', () => {
    expect(OWNER_BOOKING_REMINDER_REFERENCE_TYPE).toBe('screen');
    expect(OWNER_BOOKING_REMINDER_REFERENCE_ID).toBe('bookings');
  });

  it('keys reminders by owner and target date', () => {
    expect(ownerBookingReminderDedupeKey(' owner-1 ', ' 2026-08-21 ')).toBe(
      'booking_reminder:owner-1:2026-08-21'
    );
  });
});
