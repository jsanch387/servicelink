import {
  blockCoversDate,
  type BlockTimeEntry,
} from '@/features/availability/types/blockTime';
import { hhmmToMinutes } from './dateUtils';
import type { CalendarEvent } from './types';

export function mapTimeOffToCalendarEvents(
  blocks: BlockTimeEntry[],
  dateKeys: string[]
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const block of blocks) {
    const startMin = hhmmToMinutes(block.startTime);
    const endMin = hhmmToMinutes(block.endTime);
    if (endMin <= startMin) continue;
    const title = block.title.trim() || 'Time off';
    for (const dateKey of dateKeys) {
      if (!blockCoversDate(block, dateKey)) continue;
      events.push({
        id: `timeoff-${block.id}-${dateKey}`,
        dateKey,
        startMin,
        endMin,
        title,
        subtitle: 'Time off',
        status: 'confirmed',
        kind: 'timeOff',
        booking: null,
      });
    }
  }
  return events;
}
