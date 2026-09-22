import { DAY_END_HOUR } from './timeGrid';
import type {
  CalendarEvent,
  LaidOutCalendarEvent,
  StackedWeekEvent,
} from './types';

export const WEEK_STACK_CARD_PX = 32;
export const WEEK_STACK_GAP_PX = 3;
export const WEEK_MORE_LINE_PX = 16;
export const WEEK_VISIBLE_EVENTS = 3;

export interface WeekOverflowLink {
  id: string;
  extra: number;
  topPx: number;
}

export interface WeekDayLayout {
  events: StackedWeekEvent[];
  overflows: WeekOverflowLink[];
}

function overlaps(a: CalendarEvent, b: CalendarEvent): boolean {
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

/** Pack overlapping jobs into columns so a day can show more than one at once. */
export function layoutTimedEvents(
  events: CalendarEvent[]
): LaidOutCalendarEvent[] {
  const sorted = [...events].sort(
    (left, right) =>
      left.startMin - right.startMin || left.endMin - right.endMin
  );

  const laidOut: LaidOutCalendarEvent[] = [];
  let cluster: LaidOutCalendarEvent[] = [];
  let clusterEnd = -1;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const colCount = Math.max(...cluster.map(event => event.col)) + 1;
    for (const event of cluster) {
      laidOut.push({ ...event, colCount });
    }
    cluster = [];
  };

  for (const event of sorted) {
    if (cluster.length > 0 && event.startMin >= clusterEnd) {
      flushCluster();
      clusterEnd = -1;
    }

    const used = new Set(
      cluster.filter(other => overlaps(other, event)).map(other => other.col)
    );
    let col = 0;
    while (used.has(col)) col += 1;

    cluster.push({ ...event, col, colCount: 1 });
    clusterEnd = Math.max(clusterEnd, event.endMin);
  }

  flushCluster();
  return laidOut;
}

function groupByStartMin(
  events: CalendarEvent[]
): Map<number, CalendarEvent[]> {
  const grouped = new Map<number, CalendarEvent[]>();
  const sorted = [...events].sort(
    (left, right) => left.startMin - right.startMin
  );
  for (const event of sorted) {
    const list = grouped.get(event.startMin) ?? [];
    list.push(event);
    grouped.set(event.startMin, list);
  }
  return grouped;
}

/**
 * Pin each job to its start time. Same-start jobs stack inside that hour
 * so a busy slot does not spill into 10 / 11 / 12.
 */
function clipToVisibleHours(
  event: CalendarEvent,
  visibleStart: number,
  visibleEnd: number
): { startMin: number; endMin: number } | null {
  const startMin = Math.min(Math.max(event.startMin, visibleStart), visibleEnd);
  const endMin = Math.max(Math.min(event.endMin, visibleEnd), startMin);
  if (endMin <= startMin) return null;
  return { startMin, endMin };
}

export function layoutStackedWeekEvents(
  events: CalendarEvent[],
  startHour: number,
  pixelsPerHour: number,
  endHour = DAY_END_HOUR
): WeekDayLayout {
  const visibleStart = startHour * 60;
  const visibleEnd = endHour * 60;
  const laidOut: StackedWeekEvent[] = [];
  const overflows: WeekOverflowLink[] = [];

  for (const [startMin, group] of groupByStartMin(events)) {
    const first = group[0];
    if (!first) continue;
    const clipped = clipToVisibleHours(first, visibleStart, visibleEnd);
    if (!clipped) continue;
    const slotTop = ((clipped.startMin - visibleStart) / 60) * pixelsPerHour;

    if (group.length === 1) {
      const height = Math.max(
        WEEK_STACK_CARD_PX,
        ((clipped.endMin - clipped.startMin) / 60) * pixelsPerHour
      );
      laidOut.push({ ...first, topPx: slotTop, heightPx: height });
      continue;
    }

    const extra = Math.max(0, group.length - WEEK_VISIBLE_EVENTS);
    const visible = group.slice(0, WEEK_VISIBLE_EVENTS);
    const height =
      extra > 0
        ? Math.max(
            22,
            Math.floor(
              (pixelsPerHour -
                WEEK_MORE_LINE_PX -
                (visible.length - 1) * WEEK_STACK_GAP_PX) /
                visible.length
            )
          )
        : WEEK_STACK_CARD_PX;

    visible.forEach((event, index) => {
      laidOut.push({
        ...event,
        topPx: slotTop + index * (height + WEEK_STACK_GAP_PX),
        heightPx: height,
      });
    });

    if (extra > 0) {
      overflows.push({
        id: `week-more-${first.dateKey}-${startMin}`,
        extra,
        topPx:
          slotTop +
          visible.length * height +
          (visible.length - 1) * WEEK_STACK_GAP_PX,
      });
    }
  }

  return { events: laidOut, overflows };
}

export function groupEventsByDate(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = grouped.get(event.dateKey) ?? [];
    list.push(event);
    grouped.set(event.dateKey, list);
  }
  for (const list of grouped.values()) {
    list.sort((left, right) => left.startMin - right.startMin);
  }
  return grouped;
}

export function hasStackedDay(events: CalendarEvent[]): boolean {
  const grouped = groupEventsByDate(events);
  for (const list of grouped.values()) {
    if (list.length > 1) return true;
  }
  return false;
}
