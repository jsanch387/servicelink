import {
  isValidServiceDurationHHmm,
  minutesToServiceDurationHHmm,
  serviceDurationHHmmToMinutes,
} from '@/features/availability/utils/timeOptions';

/** Shown when duration is missing or not on the allowed 30m grid / range. */
export const SERVICE_EDIT_DURATION_ERROR =
  'Please choose a duration from 30 minutes up to 10 hours 30 minutes (30-minute steps).';

/** Resolves total minutes from a service row (DB). `duration_minutes` wins over legacy `hours_to_complete`. */
export function resolveStoredDurationMinutes(service: {
  duration_minutes: number | null;
  hours_to_complete: number | null;
}): number | null {
  if (service.duration_minutes != null && service.duration_minutes > 0) {
    return service.duration_minutes;
  }
  if (service.hours_to_complete != null && service.hours_to_complete > 0) {
    return Math.round(service.hours_to_complete * 60);
  }
  return null;
}

/** Value for the duration `TimeSelect` (`variant="duration"`), or `""` if unset. */
export function serviceEditDurationPickerValue(service: {
  duration_minutes: number | null;
  hours_to_complete: number | null;
}): string {
  return minutesToServiceDurationHHmm(resolveStoredDurationMinutes(service));
}

export type ParseServiceEditDurationResult =
  | { ok: true; durationMinutes: number }
  | { ok: false; error: string };

/** Validates picker output and returns minutes for `duration_minutes` on save. */
export function parseServiceEditDurationForSave(
  hhmm: string
): ParseServiceEditDurationResult {
  const trimmed = hhmm.trim();
  if (!trimmed || !isValidServiceDurationHHmm(trimmed)) {
    return { ok: false, error: SERVICE_EDIT_DURATION_ERROR };
  }
  return { ok: true, durationMinutes: serviceDurationHHmmToMinutes(trimmed) };
}

/** True when the duration field can enable submit (non-empty + on grid / in range). */
export function isValidServiceEditDurationInput(hhmm: string): boolean {
  const trimmed = hhmm.trim();
  return trimmed.length > 0 && isValidServiceDurationHHmm(trimmed);
}
