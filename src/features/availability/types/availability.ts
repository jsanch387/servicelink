import type { TimeOffBlockStored } from './blockTime';

/**
 * Availability feature types.
 * Used for weekly schedule and minimum notice (mock state).
 */

export interface DaySchedule {
  enabled: boolean;
  start: string; // "HH:mm" 24h
  end: string;
}

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type WeeklySchedule = Record<DayKey, DaySchedule>;

/** How far ahead a customer must book (stored as `minimum_notice`). */
export const MINIMUM_NOTICE_VALUES = [
  'none',
  '30m',
  '1h',
  '2h',
  '3h',
  '4h',
  '8h',
  '12h',
  '24h',
  '48h',
  '72h',
  '1w',
] as const;

export type MinimumNoticeValue = (typeof MINIMUM_NOTICE_VALUES)[number];

export const MINIMUM_NOTICE_OPTIONS: {
  value: MinimumNoticeValue;
  label: string;
}[] = [
  { value: 'none', label: 'No lead time' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '2h', label: '2 hours' },
  { value: '3h', label: '3 hours' },
  { value: '4h', label: '4 hours' },
  { value: '8h', label: '8 hours' },
  { value: '12h', label: '12 hours' },
  { value: '24h', label: '1 day' },
  { value: '48h', label: '2 days' },
  { value: '72h', label: '3 days' },
  { value: '1w', label: '1 week' },
];

export function isMinimumNoticeValue(
  value: string
): value is MinimumNoticeValue {
  return (MINIMUM_NOTICE_VALUES as readonly string[]).includes(value);
}

export const DEFAULT_SCHEDULE: WeeklySchedule = {
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: { enabled: false, start: '09:00', end: '17:00' },
  sunday: { enabled: false, start: '09:00', end: '17:00' },
};

/** Preset key for working hours (stored in DB as selected_preset). */
export type SelectedPresetKey =
  | 'mon_fri_9_5'
  | 'mon_sat_8_6'
  | 'weekends_only'
  | 'custom';

export const SELECTED_PRESET_VALUES: SelectedPresetKey[] = [
  'mon_fri_9_5',
  'mon_sat_8_6',
  'weekends_only',
  'custom',
];

/** API/DB shape for business_availability (one row per business). */
export interface BusinessAvailabilityRow {
  id: string;
  business_id: string;
  accept_bookings: boolean;
  minimum_notice: string;
  weekly_schedule: WeeklySchedule;
  selected_preset: string;
  /** ISO dates + local HH:mm; see `TimeOffBlockStored` */
  time_off_blocks?: TimeOffBlockStored[] | null;
  created_at: string;
  updated_at: string;
}
