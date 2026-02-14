import type { WeeklySchedule } from '../types/availability';

/**
 * Mon–Fri 9am–5pm
 */
export const PRESET_MON_FRI_9_5: WeeklySchedule = {
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: { enabled: false, start: '09:00', end: '17:00' },
  sunday: { enabled: false, start: '09:00', end: '17:00' },
};

/**
 * Mon–Sat 8am–6pm
 */
export const PRESET_MON_SAT_8_6: WeeklySchedule = {
  monday: { enabled: true, start: '08:00', end: '18:00' },
  tuesday: { enabled: true, start: '08:00', end: '18:00' },
  wednesday: { enabled: true, start: '08:00', end: '18:00' },
  thursday: { enabled: true, start: '08:00', end: '18:00' },
  friday: { enabled: true, start: '08:00', end: '18:00' },
  saturday: { enabled: true, start: '08:00', end: '18:00' },
  sunday: { enabled: false, start: '08:00', end: '18:00' },
};

/**
 * Weekends only
 */
export const PRESET_WEEKENDS_ONLY: WeeklySchedule = {
  monday: { enabled: false, start: '09:00', end: '17:00' },
  tuesday: { enabled: false, start: '09:00', end: '17:00' },
  wednesday: { enabled: false, start: '09:00', end: '17:00' },
  thursday: { enabled: false, start: '09:00', end: '17:00' },
  friday: { enabled: false, start: '09:00', end: '17:00' },
  saturday: { enabled: true, start: '09:00', end: '17:00' },
  sunday: { enabled: true, start: '09:00', end: '17:00' },
};
