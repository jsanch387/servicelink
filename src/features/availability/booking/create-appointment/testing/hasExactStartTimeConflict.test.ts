import { describe, expect, it } from 'vitest';
import { hasExactStartTimeConflict } from '../utils/hasExactStartTimeConflict';

describe('hasExactStartTimeConflict', () => {
  const existing = [
    { date: '2026-07-30', startTime: '09:00', durationMinutes: 120 },
    { date: '2026-07-30', startTime: '14:00', durationMinutes: 60 },
  ];

  it('returns true for the same date and start time', () => {
    expect(
      hasExactStartTimeConflict({
        scheduledDate: '2026-07-30',
        startTime: '09:00',
        existingBookings: existing,
      })
    ).toBe(true);
  });

  it('normalizes H:mm vs HH:mm', () => {
    expect(
      hasExactStartTimeConflict({
        scheduledDate: '2026-07-30',
        startTime: '9:00',
        existingBookings: existing,
      })
    ).toBe(true);
  });

  it('returns false for a different start time on the same day', () => {
    expect(
      hasExactStartTimeConflict({
        scheduledDate: '2026-07-30',
        startTime: '09:30',
        existingBookings: existing,
      })
    ).toBe(false);
  });

  it('returns false when date or time is missing', () => {
    expect(
      hasExactStartTimeConflict({
        scheduledDate: null,
        startTime: '09:00',
        existingBookings: existing,
      })
    ).toBe(false);
  });
});
