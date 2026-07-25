/**
 * Generate available time slots in 30-minute increments.
 * Respects weekly schedule, existing bookings, owner time-off, and lead time.
 */

import type { DayKey, WeeklySchedule } from '../../types/availability';
import {
  isSlotAllowedByLeadTime,
  toLocalYYYYMMDD,
} from '../../utils/minimumNotice';
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

/** Calendar `YYYY-MM-DD` at local noon → weekday key (matches booking date usage). */
export function getDayKeyFromYYYYMMDD(isoDate: string): DayKey {
  const d = new Date(`${isoDate.trim()}T12:00:00`);
  return getDayKey(d);
}

/**
 * True when `[startTime, startTime + duration)` lies fully inside the owner's
 * enabled weekly window for that calendar day.
 */
export function isSlotWithinWeeklyHours(
  scheduledDate: string,
  startTimeHHmm: string,
  durationMinutes: number,
  weeklySchedule: WeeklySchedule
): boolean {
  const dayKey = getDayKeyFromYYYYMMDD(scheduledDate);
  const daySchedule = weeklySchedule[dayKey];
  if (!daySchedule?.enabled) return false;

  const windowStart = parseTimeHHmm(daySchedule.start);
  const windowEnd = parseTimeHHmm(daySchedule.end);
  const slotStart = parseTimeHHmm(startTimeHHmm.trim().slice(0, 5));
  const slotEnd = slotStart + Math.max(1, Math.round(durationMinutes));
  return slotStart >= windowStart && slotEnd <= windowEnd;
}

export function parseTimeHHmm(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * True if a booking [startTime, startTime + duration) overlaps any time-off
 * block that covers `scheduledDate` (inclusive date range).
 * All-day blocks cover the whole day; otherwise half-open time intervals.
 */
export function bookingOverlapsTimeOff(
  scheduledDate: string,
  startTime: string,
  durationMinutes: number,
  timeOffBlocks: ReadonlyArray<TimeOffInterval>
): boolean {
  const day = scheduledDate.trim();
  const sStart = parseTimeHHmm(startTime.trim());
  const sEnd = sStart + durationMinutes;
  return timeOffBlocks.some(b => {
    const startDate = (b.startDate ?? b.date ?? '').trim();
    const endDate = (b.endDate ?? b.date ?? startDate).trim();
    if (!startDate || !endDate) return false;
    if (day < startDate || day > endDate) return false;
    if (b.allDay) return true;
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

/** Slots are in 30-minute increments; returns array of "HH:mm" for the given date. */
export function generateTimeSlots(
  selectedDate: Date,
  weeklySchedule: WeeklySchedule,
  serviceDurationMinutes: number,
  existingBookings: ExistingBooking[],
  incrementMinutes: number = 30,
  timeOffBlocks: ReadonlyArray<TimeOffInterval> = [],
  /** `minimum_notice` from availability; owners can pass `'none'` to bypass. */
  minimumNotice: string = 'none',
  now: Date = new Date()
): string[] {
  const dayKey = getDayKey(selectedDate);
  const daySchedule = weeklySchedule[dayKey];
  if (!daySchedule.enabled) return [];

  const dayStr = toLocalYYYYMMDD(selectedDate);
  const startMins = parseTimeHHmm(daySchedule.start);
  const endMins = parseTimeHHmm(daySchedule.end);

  const slots: string[] = [];
  for (
    let t = startMins;
    t + serviceDurationMinutes <= endMins;
    t += incrementMinutes
  ) {
    const slotStart = toHHmm(t);

    if (!isSlotAllowedByLeadTime(dayStr, slotStart, minimumNotice, now)) {
      continue;
    }

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
