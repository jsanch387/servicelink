/**
 * Generate available time slots in 30-minute increments.
 * Respects weekly schedule and existing bookings.
 */

import type { DayKey, WeeklySchedule } from '../../types/availability';
import type { ExistingBooking } from '../types';

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

function parseTimeHHmm(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function toHHmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** Slots are in 30-minute increments; returns array of "HH:mm" for the given date. */
export function generateTimeSlots(
  selectedDate: Date,
  weeklySchedule: WeeklySchedule,
  serviceDurationMinutes: number,
  existingBookings: ExistingBooking[],
  incrementMinutes: number = 30
): string[] {
  const dayKey = getDayKey(selectedDate);
  const daySchedule = weeklySchedule[dayKey];
  if (!daySchedule.enabled) return [];

  const dayStr = selectedDate.toISOString().slice(0, 10);
  const startMins = parseTimeHHmm(daySchedule.start);
  const endMins = parseTimeHHmm(daySchedule.end);

  const slots: string[] = [];
  for (let t = startMins; t + serviceDurationMinutes <= endMins; t += incrementMinutes) {
    const slotStart = toHHmm(t);
    const slotEnd = toHHmm(t + serviceDurationMinutes);

    const overlaps = existingBookings.some(b => {
      if (b.date !== dayStr) return false;
      const bStart = parseTimeHHmm(b.startTime);
      const bEnd = bStart + b.durationMinutes;
      const sStart = t;
      const sEnd = t + serviceDurationMinutes;
      return sStart < bEnd && sEnd > bStart;
    });
    if (!overlaps) slots.push(slotStart);
  }
  return slots;
}
