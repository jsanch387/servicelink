import type {
  ExistingBooking,
  TimeOffInterval,
} from '@/features/availability/booking/types';
import { generateTimeSlots } from '@/features/availability/booking/utils/slotGeneration';
import type {
  DayKey,
  WeeklySchedule,
} from '@/features/availability/types/availability';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import { maintenanceAnchorDateFromIso } from '@/features/maintenance/utils/maintenanceAnchorDate';

const DAY_KEYS: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function dayKeyFromDate(date: Date): DayKey {
  return DAY_KEYS[date.getDay()];
}

export function coerceMaintenanceWeeklySchedule(
  raw: WeeklySchedule | null | undefined
): WeeklySchedule {
  if (!raw || typeof raw !== 'object') return DEFAULT_SCHEDULE;
  return raw;
}

/** 12-hour label for slot list / trigger (matches public booking grid). */
export function formatMaintenanceSlotLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return m === 0
    ? `${h12} ${ampm}`
    : `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function getMaintenanceSlotsForIsoDate(
  isoDate: string,
  weeklySchedule: WeeklySchedule,
  durationMinutes: number,
  existingBookings: ExistingBooking[],
  timeOffBlocks: TimeOffInterval[]
): string[] {
  const date = maintenanceAnchorDateFromIso(isoDate);
  if (!date) return [];
  return generateTimeSlots(
    date,
    weeklySchedule,
    Math.max(1, Math.round(durationMinutes)),
    existingBookings,
    30,
    timeOffBlocks
  );
}

/** Same disabled-day rules as public `DateSelector` (booking flow). */
export function createMaintenanceAnchorDateDisabled(params: {
  weeklySchedule: WeeklySchedule;
  durationMinutes: number;
  existingBookings: ExistingBooking[];
  timeOffBlocks: TimeOffInterval[];
}): (date: Date) => boolean {
  const { weeklySchedule, durationMinutes, existingBookings, timeOffBlocks } =
    params;
  const duration = Math.max(1, Math.round(durationMinutes));

  return (date: Date) => {
    const dayKey = dayKeyFromDate(date);
    if (!weeklySchedule[dayKey]?.enabled) return true;
    const slots = generateTimeSlots(
      date,
      weeklySchedule,
      duration,
      existingBookings,
      30,
      timeOffBlocks
    );
    return slots.length === 0;
  };
}
