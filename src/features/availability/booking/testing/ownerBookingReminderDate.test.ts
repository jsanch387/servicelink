import { describe, expect, it } from 'vitest';
import {
  addCalendarDays,
  calendarDateInTimeZone,
  bookingReminderTargetDate,
} from '../server/reminders/ownerBookingReminderDate';

describe('calendarDateInTimeZone', () => {
  it('uses the named timezone, not UTC', () => {
    // 1:30 AM UTC on Aug 21 is still Aug 20 in Chicago (CDT, UTC-5).
    const now = new Date('2026-08-21T01:30:00.000Z');
    expect(calendarDateInTimeZone(now, 'America/Chicago')).toBe('2026-08-20');
    expect(calendarDateInTimeZone(now, 'UTC')).toBe('2026-08-21');
  });
});

describe('addCalendarDays', () => {
  it('rolls over month boundaries', () => {
    expect(addCalendarDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('bookingReminderTargetDate', () => {
  it('is the next calendar day in Chicago', () => {
    const now = new Date('2026-08-20T14:00:00.000Z');
    expect(bookingReminderTargetDate(now)).toBe('2026-08-21');
  });
});
