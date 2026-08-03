import { normalizeWallClockHm } from '@/features/availability/types/blockTime';
import type { ExistingBooking } from '../../types';

/**
 * True when another booking already starts at the same date + start time.
 * Exact start match only (not duration overlap) — soft owner safeguard.
 */
export function hasExactStartTimeConflict(p: {
  scheduledDate: string | null | undefined;
  startTime: string | null | undefined;
  existingBookings: ExistingBooking[];
}): boolean {
  const date = p.scheduledDate?.trim() ?? '';
  const start = normalizeWallClockHm(p.startTime?.trim() ?? '');
  if (!date || !start) return false;

  return p.existingBookings.some(b => {
    if (b.date.trim() !== date) return false;
    const other = normalizeWallClockHm(b.startTime);
    return other === start;
  });
}
