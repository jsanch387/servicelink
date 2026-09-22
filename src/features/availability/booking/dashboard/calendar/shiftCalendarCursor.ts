import { addDaysToDateKey } from '../dayPlannerUtils';
import { addMonthsToDateKey } from './dateUtils';
import type { CalendarRange } from './types';

export function shiftCalendarCursor(
  dateKey: string,
  range: CalendarRange,
  direction: -1 | 1
): string {
  if (range === 'day') return addDaysToDateKey(dateKey, direction);
  if (range === 'week') return addDaysToDateKey(dateKey, direction * 7);
  return addMonthsToDateKey(dateKey, direction);
}
