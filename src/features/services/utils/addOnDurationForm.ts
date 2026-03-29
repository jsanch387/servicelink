import {
  isValidServiceDurationHHmm,
  minutesToServiceDurationHHmm,
  serviceDurationHHmmToMinutes,
} from '@/features/availability/utils/timeOptions';

export const ADD_ON_DURATION_ERROR =
  'If you set a duration, choose from 30 minutes up to 10 hours 30 minutes (30-minute steps only).';

/** Picker value for an add-on (`""` = no extra time). */
export function addOnDurationPickerValue(
  durationMinutes: number | null | undefined
): string {
  return minutesToServiceDurationHHmm(durationMinutes ?? null);
}

export type ParseOptionalAddOnDurationResult =
  | { ok: true; duration_minutes: number | null }
  | { ok: false; error: string };

/**
 * Optional duration: empty string → null. Otherwise same grid as services (30–630, :00/:30 only).
 */
export function parseOptionalAddOnDurationForSave(
  hhmm: string
): ParseOptionalAddOnDurationResult {
  const trimmed = hhmm.trim();
  if (!trimmed) return { ok: true, duration_minutes: null };
  if (!isValidServiceDurationHHmm(trimmed)) {
    return { ok: false, error: ADD_ON_DURATION_ERROR };
  }
  return {
    ok: true,
    duration_minutes: serviceDurationHHmmToMinutes(trimmed),
  };
}

export function isValidOptionalAddOnDurationInput(hhmm: string): boolean {
  const trimmed = hhmm.trim();
  if (!trimmed) return true;
  return isValidServiceDurationHHmm(trimmed);
}
