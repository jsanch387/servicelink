import type { CalendarEvent } from './types';

export function sortCalendarListEvents(
  events: CalendarEvent[],
  direction: 'asc' | 'desc' = 'desc'
): CalendarEvent[] {
  const dir = direction === 'asc' ? 1 : -1;
  return [...events].sort((left, right) => {
    const dateCompare = left.dateKey.localeCompare(right.dateKey);
    if (dateCompare !== 0) return dateCompare * dir;
    return (left.startMin - right.startMin) * dir;
  });
}
