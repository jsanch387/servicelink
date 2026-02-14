/**
 * Availability Feature
 *
 * Exports for the availability feature. Gated by AVAILABILITY_FEATURE_ENABLED.
 */

export { AvailabilityContent } from './components/AvailabilityContent';
export { AVAILABILITY_FEATURE_ENABLED } from './constants';
export type {
  DayKey,
  DaySchedule,
  MinimumNoticeValue,
  WeeklySchedule,
} from './types/availability';
