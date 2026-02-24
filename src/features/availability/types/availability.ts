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

export type MinimumNoticeValue = 'none' | '1h' | '2h' | '4h' | '24h';

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
  created_at: string;
  updated_at: string;
}
