import {
  DEFAULT_SCHEDULE,
  type DayKey,
  type WeeklySchedule,
} from '@/features/availability/types/availability';

const DAYS: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

function clock(value: string): string {
  return value.trim().slice(0, 5);
}

function isWeeklySchedule(value: unknown): value is WeeklySchedule {
  if (!value || typeof value !== 'object') return false;
  return DAYS.every(day => {
    const entry = (value as Record<string, unknown>)[day];
    if (!entry || typeof entry !== 'object') return false;
    const daySchedule = entry as Record<string, unknown>;
    return (
      typeof daySchedule.enabled === 'boolean' &&
      typeof daySchedule.start === 'string' &&
      typeof daySchedule.end === 'string'
    );
  });
}

/**
 * Signup writes Mon–Fri 9–5. This is true once that week no longer matches.
 */
export function ownerCustomizedHours(
  schedule: unknown,
  preset: string | null | undefined
): boolean {
  if (preset && preset !== 'mon_fri_9_5') return true;
  if (!isWeeklySchedule(schedule)) return false;
  return DAYS.some(day => {
    const actual = schedule[day];
    const expected = DEFAULT_SCHEDULE[day];
    return (
      actual.enabled !== expected.enabled ||
      clock(actual.start) !== expected.start ||
      clock(actual.end) !== expected.end
    );
  });
}
