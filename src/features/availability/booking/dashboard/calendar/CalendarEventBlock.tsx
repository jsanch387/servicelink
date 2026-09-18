'use client';

import { calendarAssigneeLabel } from '../utils/bookingAssigneeBoardLabel';
import { formatMinutesLabel } from './dateUtils';
import { eventChipClass } from './eventStyles';
import { DAY_END_HOUR } from './timeGrid';
import type { LaidOutCalendarEvent } from './types';

interface CalendarEventBlockProps {
  event: LaidOutCalendarEvent;
  startHour: number;
  pixelsPerHour: number;
  onSelect?: () => void;
  topPx?: number;
  heightPx?: number;
}

export function CalendarEventBlock({
  event,
  startHour,
  pixelsPerHour,
  onSelect,
  topPx,
  heightPx,
}: CalendarEventBlockProps) {
  const visibleStart = startHour * 60;
  const visibleEnd = DAY_END_HOUR * 60;
  const startMin = Math.min(Math.max(event.startMin, visibleStart), visibleEnd);
  const endMin = Math.max(Math.min(event.endMin, visibleEnd), startMin + 15);
  const top = topPx ?? ((startMin - visibleStart) / 60) * pixelsPerHour;
  const height =
    heightPx ?? Math.max(32, ((endMin - startMin) / 60) * pixelsPerHour);
  const widthPct = 100 / event.colCount;
  const leftPct = event.col * widthPct;
  const clickable = Boolean(onSelect);
  const compact = height <= 36;
  const assignee = calendarAssigneeLabel(event.assigneeLabel);
  const title =
    compact && assignee ? `${event.title} · ${assignee}` : event.title;
  const meta = assignee
    ? `${formatMinutesLabel(event.startMin)} · ${assignee}`
    : formatMinutesLabel(event.startMin);

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onSelect}
      className={`absolute overflow-hidden rounded-lg px-2 text-left ${
        compact ? 'py-1' : 'py-1.5'
      } ${eventChipClass(event.status, event.kind)} ${
        clickable ? 'cursor-pointer hover:brightness-110' : 'cursor-default'
      }`}
      style={{
        top,
        height,
        left: `calc(${leftPct}% + 3px)`,
        width: `calc(${widthPct}% - 6px)`,
      }}
      title={`${event.title} · ${meta}`}
    >
      <p className="truncate text-[12px] font-semibold leading-tight">
        {title}
      </p>
      {compact ? null : (
        <p
          className={`truncate text-[11px] ${
            event.kind === 'timeOff' ? 'text-zinc-400' : 'text-white/75'
          }`}
        >
          {meta}
        </p>
      )}
    </button>
  );
}
