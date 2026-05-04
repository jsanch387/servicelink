/**
 * Generate available time slots in 30-minute increments.
 * Respects weekly schedule, existing bookings, and owner time-off blocks.
 */

import type { DayKey, WeeklySchedule } from '../../types/availability';
import type { ExistingBooking, TimeOffInterval } from '../types';

/**
 * True if a booking [startTime, startTime + duration) overlaps any existing
 * booking on the same calendar day (same half-open convention as time-off).
 */
export function bookingOverlapsExistingBookings(
  scheduledDate: string,
  startTime: string,
  durationMinutes: number,
  existingBookings: ReadonlyArray<ExistingBooking>
): boolean {
  const sStart = parseTimeHHmm(startTime.trim().slice(0, 5));
  const sEnd = sStart + Math.max(1, durationMinutes);
  return existingBookings.some(b => {
    if (b.date !== scheduledDate) return false;
    const bStart = parseTimeHHmm(
      String(b.startTime ?? '')
        .trim()
        .slice(0, 5)
    );
    const bEnd = bStart + Math.max(1, b.durationMinutes);
    return sStart < bEnd && sEnd > bStart;
  });
}

const DAY_KEYS: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function getDayKey(date: Date): DayKey {
  const dayIndex = date.getDay();
  return DAY_KEYS[dayIndex];
}

export function parseTimeHHmm(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * True if a booking [startTime, startTime + duration) overlaps any time-off
 * block on the same calendar day (half-open intervals: block end is exclusive).
 */
export function bookingOverlapsTimeOff(
  scheduledDate: string,
  startTime: string,
  durationMinutes: number,
  timeOffBlocks: ReadonlyArray<TimeOffInterval>
): boolean {
  const sStart = parseTimeHHmm(startTime.trim());
  const sEnd = sStart + durationMinutes;
  return timeOffBlocks.some(b => {
    if (b.date !== scheduledDate) return false;
    const bStart = parseTimeHHmm(b.startTime);
    const bEnd = parseTimeHHmm(b.endTime);
    return sStart < bEnd && sEnd > bStart;
  });
}

function toHHmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** Minutes from midnight for "now" in local time (used when selected date is today). */
function getCurrentMinutesFromMidnight(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/** True if the given date is the same calendar day as today (local time). */
function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** Slots are in 30-minute increments; returns array of "HH:mm" for the given date. */
export function generateTimeSlots(
  selectedDate: Date,
  weeklySchedule: WeeklySchedule,
  serviceDurationMinutes: number,
  existingBookings: ExistingBooking[],
  incrementMinutes: number = 30,
  timeOffBlocks: ReadonlyArray<TimeOffInterval> = []
): string[] {
  const dayKey = getDayKey(selectedDate);
  const daySchedule = weeklySchedule[dayKey];
  if (!daySchedule.enabled) return [];

  const dayStr = selectedDate.toISOString().slice(0, 10);
  const startMins = parseTimeHHmm(daySchedule.start);
  const endMins = parseTimeHHmm(daySchedule.end);

  const nowMins = isToday(selectedDate) ? getCurrentMinutesFromMidnight() : -1;

  const slots: string[] = [];
  for (
    let t = startMins;
    t + serviceDurationMinutes <= endMins;
    t += incrementMinutes
  ) {
    if (nowMins >= 0 && t <= nowMins) continue;

    const slotStart = toHHmm(t);

    const overlapsBooking = existingBookings.some(b => {
      if (b.date !== dayStr) return false;
      const bStart = parseTimeHHmm(b.startTime);
      const bEnd = bStart + b.durationMinutes;
      const sStart = t;
      const sEnd = t + serviceDurationMinutes;
      return sStart < bEnd && sEnd > bStart;
    });
    if (overlapsBooking) continue;

    const overlapsTimeOff = bookingOverlapsTimeOff(
      dayStr,
      slotStart,
      serviceDurationMinutes,
      timeOffBlocks
    );
    if (!overlapsTimeOff) slots.push(slotStart);
  }
  return slots;
}
