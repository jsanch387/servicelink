import type { CalendarEvent, CalendarEventKind } from './types';

/** Gray diagonal hatch for time-off chips and month day cells. */
export const TIME_OFF_HATCH_CLASS =
  'bg-[linear-gradient(rgba(255,255,255,0.04),rgba(255,255,255,0.04)),repeating-linear-gradient(-45deg,rgba(255,255,255,0.12)_0_1.5px,transparent_1.5px_7px)]';

/** Shared fill for list status pills and calendar blocks. */
export function eventChipClass(
  status: CalendarEvent['status'],
  kind: CalendarEventKind = 'booking'
): string {
  if (kind === 'timeOff') {
    return `border border-white/10 text-zinc-300 ${TIME_OFF_HATCH_CLASS}`;
  }
  if (status === 'completed') {
    return 'bg-emerald-500/20 text-emerald-100';
  }
  if (status === 'cancelled') {
    return 'bg-rose-500/20 text-rose-100';
  }
  return 'bg-sky-500/20 text-sky-50';
}
