'use client';

import { isDateKeyToday } from '../dayPlannerUtils';
import { CalendarEventChip } from './CalendarEventChip';
import { dayNumber, isSameMonth } from './dateUtils';
import { TIME_OFF_HATCH_CLASS } from './eventStyles';
import { groupEventsByDate, WEEK_VISIBLE_EVENTS } from './layoutEvents';
import type { CalendarEvent } from './types';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_CHIPS = WEEK_VISIBLE_EVENTS;
const MOBILE_MAX_CHIPS = 2;

interface CalendarMonthViewProps {
  monthKey: string;
  gridKeys: string[];
  events: CalendarEvent[];
  onSelectDay: (dateKey: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export function CalendarMonthView({
  monthKey,
  gridKeys,
  events,
  onSelectDay,
  onSelectEvent,
}: CalendarMonthViewProps) {
  const byDate = groupEventsByDate(events);

  return (
    <div className="-mx-3 sm:mx-0">
      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map(label => (
          <p
            key={label}
            className="py-2 text-center text-[11px] font-bold tracking-wide text-zinc-400 sm:px-2 sm:py-3 sm:text-left sm:text-xs sm:text-zinc-200"
          >
            <span className="sm:hidden">{label.slice(0, 1)}</span>
            <span className="hidden sm:inline">{label}</span>
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7 border-t border-white/10">
        {gridKeys.map(key => {
          const dayEvents = byDate.get(key) ?? [];
          const hasTimeOff = dayEvents.some(event => event.kind === 'timeOff');
          const bookingEvents = dayEvents.filter(
            event => event.kind !== 'timeOff'
          );
          const visible = bookingEvents.slice(0, MAX_CHIPS);
          const extra = bookingEvents.length - visible.length;
          const mobileExtra = bookingEvents.length - MOBILE_MAX_CHIPS;
          const inMonth = isSameMonth(key, monthKey);
          const today = isDateKeyToday(key);

          return (
            <div
              key={key}
              data-time-off={hasTimeOff ? 'true' : undefined}
              className={`relative flex min-h-[7rem] flex-col overflow-hidden border-b border-r border-white/10 px-1 py-1.5 sm:min-h-[8.5rem] sm:px-2 sm:py-2 [&:nth-child(7n)]:border-r-0 [&:nth-last-child(-n+7)]:border-b-0 ${
                hasTimeOff ? TIME_OFF_HATCH_CLASS : ''
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectDay(key)}
                aria-label={
                  hasTimeOff ? `Open ${key}, time off` : `Open ${key}`
                }
                className={`mb-1.5 inline-flex h-8 w-8 cursor-pointer items-center justify-center self-center rounded-lg text-sm font-bold sm:mb-2 sm:self-start ${
                  today
                    ? 'bg-white text-black'
                    : inMonth
                      ? 'text-white hover:bg-white/10'
                      : 'text-zinc-500 hover:bg-white/5'
                }`}
              >
                {dayNumber(key)}
              </button>
              <div className="relative z-[1] space-y-1">
                {visible.map((event, index) => (
                  <div
                    key={event.id}
                    className={
                      index >= MOBILE_MAX_CHIPS ? 'hidden sm:block' : ''
                    }
                  >
                    <CalendarEventChip
                      event={event}
                      compact
                      onSelect={
                        event.booking ? () => onSelectEvent(event) : undefined
                      }
                    />
                  </div>
                ))}
                {mobileExtra > 0 ? (
                  <button
                    type="button"
                    onClick={() => onSelectDay(key)}
                    className="cursor-pointer px-1 text-[10px] font-medium text-zinc-400 hover:text-zinc-200 sm:hidden"
                  >
                    +{mobileExtra} more
                  </button>
                ) : null}
                {extra > 0 ? (
                  <button
                    type="button"
                    onClick={() => onSelectDay(key)}
                    className="hidden cursor-pointer px-2 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 sm:inline"
                  >
                    +{extra} more
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                tabIndex={-1}
                aria-hidden
                onClick={() => onSelectDay(key)}
                className="mt-auto min-h-[0.75rem] flex-1 cursor-pointer"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
