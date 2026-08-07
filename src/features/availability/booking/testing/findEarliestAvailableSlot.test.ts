import { describe, expect, it } from 'vitest';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import { findEarliestAvailableSlot } from '../utils/slotGeneration';

describe('findEarliestAvailableSlot', () => {
  it('returns today at open when nothing is booked yet and now is before open', () => {
    const now = new Date('2026-08-10T08:00:00'); // Monday, 8am local, before 9am open
    const result = findEarliestAvailableSlot({
      weeklySchedule: DEFAULT_SCHEDULE,
      serviceDurationMinutes: 60,
      existingBookings: [],
      now,
      minDate: now,
    });
    expect(result).not.toBeNull();
    expect(result?.date.toDateString()).toBe(now.toDateString());
    expect(result?.time).toBe('09:00');
  });

  it('skips a fully booked day and returns the next open day', () => {
    const now = new Date('2026-08-10T08:00:00'); // Monday
    const result = findEarliestAvailableSlot({
      weeklySchedule: DEFAULT_SCHEDULE,
      serviceDurationMinutes: 480, // whole 9-5 day
      existingBookings: [
        { date: '2026-08-10', startTime: '09:00', durationMinutes: 480 },
      ],
      now,
      minDate: now,
    });
    expect(result).not.toBeNull();
    // Tuesday (next enabled day) since Monday's only slot is taken.
    expect(result?.date.toDateString()).toBe(
      new Date('2026-08-11T12:00:00').toDateString()
    );
  });

  it('skips disabled weekdays (e.g. weekend) entirely', () => {
    const now = new Date('2026-08-14T08:00:00'); // Friday
    const result = findEarliestAvailableSlot({
      weeklySchedule: DEFAULT_SCHEDULE,
      serviceDurationMinutes: 480,
      existingBookings: [
        { date: '2026-08-14', startTime: '09:00', durationMinutes: 480 },
      ],
      now,
      minDate: now,
    });
    expect(result).not.toBeNull();
    // Saturday/Sunday disabled — next available is Monday.
    expect(result?.date.toDateString()).toBe(
      new Date('2026-08-17T12:00:00').toDateString()
    );
  });

  it('returns null when no weekday is enabled', () => {
    const now = new Date('2026-08-10T08:00:00');
    const result = findEarliestAvailableSlot({
      weeklySchedule: {
        monday: { enabled: false, start: '09:00', end: '17:00' },
        tuesday: { enabled: false, start: '09:00', end: '17:00' },
        wednesday: { enabled: false, start: '09:00', end: '17:00' },
        thursday: { enabled: false, start: '09:00', end: '17:00' },
        friday: { enabled: false, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '09:00', end: '17:00' },
        sunday: { enabled: false, start: '09:00', end: '17:00' },
      },
      serviceDurationMinutes: 60,
      existingBookings: [],
      now,
      minDate: now,
      maxDaysAhead: 10,
    });
    expect(result).toBeNull();
  });
});
