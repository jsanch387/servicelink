'use client';

import { isDateKeyToday } from '../dayPlannerUtils';
import { CalendarNowLine } from './CalendarNowLine';
import { CalendarEventBlock } from './CalendarEventBlock';
import { CalendarTimeColumn } from './CalendarTimeColumn';
import { dayNumber, weekdayShort } from './dateUtils';
import { groupEventsByDate, layoutStackedWeekEvents } from './layoutEvents';
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  TIME_LABEL_PAD_PX,
  WEEK_PIXELS_PER_HOUR,
  gridHeightPx,
  slotHours,
} from './timeGrid';
import type { CalendarEvent } from './types';

interface CalendarWeekViewProps {
  weekKeys: string[];
  events: CalendarEvent[];
  onSelectDay: (dateKey: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export function CalendarWeekView({
  weekKeys,
  events,
  onSelectDay,
  onSelectEvent,
}: CalendarWeekViewProps) {
  const hours = slotHours(DAY_START_HOUR, DAY_END_HOUR);
  const byDate = groupEventsByDate(events);
  const height = gridHeightPx(
    DAY_START_HOUR,
    DAY_END_HOUR,
    WEEK_PIXELS_PER_HOUR
  );

  return (
    <div>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="min-w-[48rem]">
          <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))]">
            <div />
            {weekKeys.map(key => {
              const today = isDateKeyToday(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectDay(key)}
                  className="cursor-pointer px-1 py-3 text-center hover:bg-white/5"
                >
                  <p className="text-[11px] font-bold tracking-wide text-zinc-200">
                    {weekdayShort(key)}
                  </p>
                  <p
                    className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                      today ? 'bg-white text-black' : 'text-white'
                    }`}
                  >
                    {dayNumber(key)}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="max-h-[min(44rem,72dvh)] overflow-auto scrollbar-dark">
            <div className="relative grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] pb-3.5">
              <CalendarTimeColumn
                pixelsPerHour={WEEK_PIXELS_PER_HOUR}
                className="sticky left-0 z-10 pr-2"
              />
              {weekKeys.map(key => {
                const { events: stacked, overflows } = layoutStackedWeekEvents(
                  byDate.get(key) ?? [],
                  DAY_START_HOUR,
                  WEEK_PIXELS_PER_HOUR
                );
                return (
                  <div
                    key={key}
                    className="relative overflow-hidden border-l border-white/10"
                    style={{ height, marginTop: TIME_LABEL_PAD_PX }}
                  >
                    {hours.map((hour, index) => (
                      <div
                        key={hour}
                        className={`border-t border-white/10 ${
                          index === hours.length - 1
                            ? 'border-b border-white/10'
                            : ''
                        }`}
                        style={{ height: WEEK_PIXELS_PER_HOUR }}
                      />
                    ))}
                    <CalendarNowLine
                      dateKey={key}
                      startHour={DAY_START_HOUR}
                      pixelsPerHour={WEEK_PIXELS_PER_HOUR}
                    />
                    {stacked.map(event => (
                      <CalendarEventBlock
                        key={event.id}
                        event={{ ...event, col: 0, colCount: 1 }}
                        startHour={DAY_START_HOUR}
                        pixelsPerHour={WEEK_PIXELS_PER_HOUR}
                        topPx={event.topPx}
                        heightPx={event.heightPx}
                        onSelect={
                          event.booking ? () => onSelectEvent(event) : undefined
                        }
                      />
                    ))}
                    {overflows.map(overflow => (
                      <button
                        key={overflow.id}
                        type="button"
                        onClick={() => onSelectDay(key)}
                        className="absolute z-10 cursor-pointer px-2 text-left text-[11px] font-medium text-zinc-400 hover:text-zinc-200"
                        style={{ top: overflow.topPx, left: 3, right: 3 }}
                      >
                        +{overflow.extra} more
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
