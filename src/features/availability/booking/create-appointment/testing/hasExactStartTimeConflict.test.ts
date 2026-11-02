import { describe, expect, it } from 'vitest';
import {
  countBookingsOnDate,
  hasExactStartTimeConflict,
  ownerRescheduleOverlapHeadsUp,
  sameDayAppointmentHeadsUp,
  sameDayRescheduleHeadsUp,
} from '../../utils/hasExactStartTimeConflict';

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

describe('countBookingsOnDate', () => {
  const existing = [
    { date: '2026-07-30', startTime: '09:00', durationMinutes: 120 },
    { date: '2026-07-30', startTime: '14:00', durationMinutes: 60 },
    { date: '2026-07-31', startTime: '09:00', durationMinutes: 60 },
  ];

  it('counts appointments on the selected day', () => {
    expect(countBookingsOnDate('2026-07-30', existing)).toBe(2);
  });

  it('returns 0 when the day is empty or missing', () => {
    expect(countBookingsOnDate('2026-08-01', existing)).toBe(0);
    expect(countBookingsOnDate(null, existing)).toBe(0);
  });
});

describe('sameDayAppointmentHeadsUp', () => {
  it('returns null when there are none', () => {
    expect(sameDayAppointmentHeadsUp(0)).toBeNull();
  });

  it('uses singular and plural copy', () => {
    expect(sameDayAppointmentHeadsUp(1)).toBe(
      'You already have 1 appointment on this day. Continue to add another.'
    );
    expect(sameDayAppointmentHeadsUp(2)).toBe(
      'You already have 2 appointments on this day. Continue to add another.'
    );
  });
});

describe('ownerRescheduleOverlapHeadsUp', () => {
  const existing = [
    { date: '2026-07-30', startTime: '09:00', durationMinutes: 120 },
    { date: '2026-07-30', startTime: '14:00', durationMinutes: 60 },
  ];

  it('mentions the time when the start already has a job', () => {
    expect(
      ownerRescheduleOverlapHeadsUp({
        scheduledDate: '2026-07-30',
        startTime: '09:00',
        existingBookings: existing,
      })
    ).toBe('You already have an appointment at this time. You can still save.');
  });

  it('mentions the day when the date is busy but the time is free', () => {
    expect(sameDayRescheduleHeadsUp(1)).toBe(
      'You already have 1 appointment on this day. Continue to move this one here.'
    );
    expect(
      ownerRescheduleOverlapHeadsUp({
        scheduledDate: '2026-07-30',
        startTime: '10:00',
        existingBookings: existing,
      })
    ).toBe(
      'You already have 2 appointments on this day. Continue to move this one here.'
    );
  });

  it('returns null when the day is empty', () => {
    expect(
      ownerRescheduleOverlapHeadsUp({
        scheduledDate: '2026-08-01',
        startTime: '09:00',
        existingBookings: existing,
      })
    ).toBeNull();
  });
});
