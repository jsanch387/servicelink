'use client';

import { CalendarNowLine } from './CalendarNowLine';
import { CalendarEventBlock } from './CalendarEventBlock';
import { CalendarTimeColumn } from './CalendarTimeColumn';
import { layoutTimedEvents } from './layoutEvents';
import {
  DAY_END_HOUR,
  DAY_PIXELS_PER_HOUR,
  DAY_START_HOUR,
  TIME_LABEL_PAD_PX,
  gridHeightPx,
  slotHours,
} from './timeGrid';
import type { CalendarEvent } from './types';

interface CalendarDayViewProps {
  dateKey: string;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

export function CalendarDayView({
  dateKey,
  events,
  onSelectEvent,
}: CalendarDayViewProps) {
  const hours = slotHours(DAY_START_HOUR, DAY_END_HOUR);
  const laidOut = layoutTimedEvents(events);
  const height = gridHeightPx(
    DAY_START_HOUR,
    DAY_END_HOUR,
    DAY_PIXELS_PER_HOUR
  );

  return (
    <div>
      <div className="max-h-[min(48rem,78dvh)] overflow-auto scrollbar-dark">
        <div className="relative flex min-w-[20rem] pb-3.5">
          <CalendarTimeColumn
            pixelsPerHour={DAY_PIXELS_PER_HOUR}
            className="sticky left-0 z-10 w-16 pr-3"
          />
          <div
            className="relative min-w-0 flex-1"
            style={{ height, marginTop: TIME_LABEL_PAD_PX }}
          >
            {hours.map((hour, index) => (
              <div
                key={hour}
                className={`border-t border-white/10 ${
                  index === hours.length - 1 ? 'border-b' : ''
                }`}
                style={{ height: DAY_PIXELS_PER_HOUR }}
              />
            ))}
            <CalendarNowLine
              dateKey={dateKey}
              startHour={DAY_START_HOUR}
              pixelsPerHour={DAY_PIXELS_PER_HOUR}
            />
            {laidOut.map(event => (
              <CalendarEventBlock
                key={event.id}
                event={event}
                startHour={DAY_START_HOUR}
                pixelsPerHour={DAY_PIXELS_PER_HOUR}
                onSelect={
                  event.booking ? () => onSelectEvent(event) : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
