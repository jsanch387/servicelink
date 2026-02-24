/**
 * Mock data for Availability Booking POC.
 */

import type { WeeklySchedule } from '../types/availability';
import type { ExistingBooking } from './types';
import { PRESET_MON_FRI_9_5 } from '../utils/presets';

export const MOCK_WEEKLY_SCHEDULE: WeeklySchedule = { ...PRESET_MON_FRI_9_5 };

/** Mock existing bookings for the given month so some slots appear taken. */
export function getMockExistingBookingsForMonth(
  year: number,
  month: number
): ExistingBooking[] {
  const result: ExistingBooking[] = [];
  const base = [
    { startTime: '10:00', durationMinutes: 60 },
    { startTime: '14:00', durationMinutes: 60 },
    { startTime: '15:00', durationMinutes: 30 },
  ];
  for (let day = 1; day <= 28; day += 2) {
    const d = new Date(year, month, day);
    if (d.getMonth() !== month) continue;
    const dateStr = d.toISOString().slice(0, 10);
    base.forEach(({ startTime, durationMinutes }) => {
      result.push({ date: dateStr, startTime, durationMinutes });
    });
  }
  return result;
}
