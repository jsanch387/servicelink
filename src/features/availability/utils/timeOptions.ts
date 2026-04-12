/**
 * Time options for availability: 6:00 AM → 10:00 PM, 30-minute increments.
 * Also helpers for compact hour/minute picker (short lists, mobile-friendly).
 */

export interface TimeOption {
  value: string; // "HH:mm" 24h
  label: string;
}

const MINUTES = ['00', '30'];
const START_HOUR = 6;
const END_HOUR = 22; // 10 PM

function formatLabel(hour: number, minute: string): string {
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${minute} ${ampm}`;
}

function padHour(hour: number): string {
  return hour.toString().padStart(2, '0');
}

export function getTimeOptions(): TimeOption[] {
  const options: TimeOption[] = [];
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    for (const minute of MINUTES) {
      if (hour === END_HOUR && minute === '30') break;
      const value = `${padHour(hour)}:${minute}`;
      options.push({ value, label: formatLabel(hour, minute) });
    }
  }
  return options;
}

/** Hour options for compact picker: 6 AM … 10 PM (17 options) */
export const HOUR_OPTIONS = (() => {
  const out: { value: string; label: string }[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    const label =
      h === 0
        ? '12 AM'
        : h < 12
          ? `${h} AM`
          : h === 12
            ? '12 PM'
            : `${h - 12} PM`;
    out.push({ value: padHour(h), label });
  }
  return out;
})();

/** Minute options for compact picker — short labels for small tap targets */
export const MINUTE_OPTIONS: { value: string; label: string }[] = [
  { value: '00', label: '00' },
  { value: '30', label: '30' },
];

/** Parse "HH:mm" to { hour: "06", minute: "00" } */
export function parseTime(value: string): { hour: string; minute: string } {
  const [hour = '09', minute = '00'] = value.split(':');
  return { hour: hour.padStart(2, '0'), minute: minute.padStart(2, '0') };
}

/** Build "HH:mm" from hour and minute strings */
export function buildTime(hour: string, minute: string): string {
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

/** Compare "HH:mm" times (returns -1, 0, or 1) */
export function compareTime(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** Hourly only: 6 AM → 10 PM. Value is "HH:00" (e.g. "09:00"). 17 options. */
export function getHourlyTimeOptions(): TimeOption[] {
  const options: TimeOption[] = [];
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    const value = `${padHour(hour)}:00`;
    options.push({ value, label: formatLabel(hour, '00') });
  }
  return options;
}

/** Normalize "HH:mm" to hourly "HH:00" (
r ound down). */

export function toHourly(value: string): string {
  const [h = '09'] = value.split(':');
  return `${h.padStart(2, '0')}:00`;
}

/** 24h "HH:mm" -> { hour12: 1-12, minute: "00"|"30", ampm: "AM"|"PM" } */
export function from24h(value: string): {
  hour12: number;
  minute: '00' | '30';
  ampm: 'AM' | 'PM';
} {
  const [hStr = '09', mStr = '00'] = value.split(':');
  const hour24 = parseInt(hStr, 10) || 9;
  const minute = mStr === '30' ? '30' : '00';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  const ampm: 'AM' | 'PM' = hour24 < 12 ? 'AM' : 'PM';
  return { hour12, minute, ampm };
}

/** { hour12, minute, ampm } -> 24h "HH:mm" */
export function to24h(
  hour12: number,
  minute: '00' | '30',
  ampm: 'AM' | 'PM'
): string {
  let hour24 = hour12;
  if (ampm === 'AM') hour24 = hour12 === 12 ? 0 : hour12;
  else hour24 = hour12 === 12 ? 12 : hour12 + 12;
  return `${hour24.toString().padStart(2, '0')}:${minute}`;
}

/** Service duration picker: 30 min … 10 hr 30 min, 30-minute steps only. */
export const SERVICE_DURATION_MIN_MINUTES = 30;
export const SERVICE_DURATION_MAX_MINUTES = 10 * 60 + 30;

export function serviceDurationHHmmToMinutes(hhmm: string): number {
  const [h = '0', m = '00'] = hhmm.split(':');
  const hours = Math.min(10, Math.max(0, parseInt(h, 10) || 0));
  const minute = m === '30' ? 30 : 0;
  return hours * 60 + minute;
}

/** Map stored minutes → "HH:mm" for {@link TimeSelect} `variant="duration"` (empty if unset). */
export function minutesToServiceDurationHHmm(
  total: number | null | undefined
): string {
  if (total == null || total <= 0) return '';
  const rounded = Math.round(total / 30) * 30;
  const clamped = Math.min(
    SERVICE_DURATION_MAX_MINUTES,
    Math.max(SERVICE_DURATION_MIN_MINUTES, rounded)
  );
  const h = Math.floor(clamped / 60);
  const rem = clamped % 60;
  return `${h.toString().padStart(2, '0')}:${rem === 30 ? '30' : '00'}`;
}

/** Clamp arbitrary "H:mm" / stored values to the service duration grid. */
export function normalizeServiceDurationHHmm(input: string): string {
  if (!input.trim()) return '';
  let mins = serviceDurationHHmmToMinutes(input);
  if (mins <= 0) mins = SERVICE_DURATION_MIN_MINUTES;
  mins = Math.min(
    SERVICE_DURATION_MAX_MINUTES,
    Math.max(SERVICE_DURATION_MIN_MINUTES, Math.round(mins / 30) * 30)
  );
  return minutesToServiceDurationHHmm(mins);
}

export function isValidServiceDurationHHmm(hhmm: string): boolean {
  const trimmed = hhmm.trim();
  if (!/^\d{1,2}:\d{2}$/.test(trimmed)) return false;
  const [hRaw, minRaw] = trimmed.split(':');
  const h = parseInt(hRaw ?? '', 10);
  if (!Number.isFinite(h) || h < 0 || h > 10) return false;
  const mm = (minRaw ?? '').padStart(2, '0');
  if (mm !== '00' && mm !== '30') return false;
  const total = h * 60 + (mm === '30' ? 30 : 0);
  return (
    total >= SERVICE_DURATION_MIN_MINUTES &&
    total <= SERVICE_DURATION_MAX_MINUTES
  );
}

/** Trigger label for duration picker (not clock time). */
export function formatServiceDurationSelectLabel(hhmm: string): string {
  const [hs, ms] = hhmm.split(':');
  const h = Math.min(10, Math.max(0, parseInt(hs, 10) || 0));
  const minuteHalf = ms === '30';
  if (h === 0 && minuteHalf) return '30 min';
  if (!minuteHalf) return h === 1 ? '1 hr' : `${h} hrs`;
  return h === 1 ? '1 hr 30 min' : `${h} hrs 30 min`;
}
