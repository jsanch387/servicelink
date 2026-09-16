'use client';

import { formatMinutesLabel } from './dateUtils';
import { eventChipClass } from './eventStyles';
import type { CalendarEvent } from './types';

interface CalendarEventChipProps {
  event: CalendarEvent;
  onSelect?: () => void;
  showTime?: boolean;
  compact?: boolean;
}

export function CalendarEventChip({
  event,
  onSelect,
  showTime = true,
  compact = false,
}: CalendarEventChipProps) {
  const className = `flex w-full min-w-0 items-center gap-1.5 text-left font-medium leading-tight ${
    compact
      ? 'rounded-md px-1 py-0.5 text-[10px] sm:rounded-lg sm:px-2 sm:py-1 sm:text-[11px]'
      : 'rounded-lg px-2 py-1 text-[11px]'
  } ${eventChipClass(event.status, event.kind)}`;
  const body = (
    <>
      <span className="min-w-0 truncate">{event.title}</span>
      {showTime ? (
        <span className="ml-auto hidden shrink-0 text-[10px] opacity-80 sm:inline">
          {formatMinutesLabel(event.startMin)}
        </span>
      ) : null}
    </>
  );

  if (!onSelect) {
    return <span className={className}>{body}</span>;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${className} cursor-pointer`}
    >
      {body}
    </button>
  );
}
