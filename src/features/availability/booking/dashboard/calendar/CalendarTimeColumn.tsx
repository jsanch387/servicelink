'use client';

import { formatMinutesLabel } from './dateUtils';
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  TIME_LABEL_PAD_PX,
  hourRange,
  slotHours,
} from './timeGrid';

interface CalendarTimeColumnProps {
  pixelsPerHour: number;
  className?: string;
  padTop?: number;
  /** When false, 6 AM sits under the header instead of on a second line. */
  pinFirstLabel?: boolean;
}

export function CalendarTimeColumn({
  pixelsPerHour,
  className = '',
  padTop = TIME_LABEL_PAD_PX,
  pinFirstLabel = true,
}: CalendarTimeColumnProps) {
  const slots = slotHours(DAY_START_HOUR, DAY_END_HOUR);
  const lastHour =
    hourRange(DAY_START_HOUR, DAY_END_HOUR).at(-1) ?? DAY_END_HOUR;

  return (
    <div
      className={`shrink-0 text-right ${className}`}
      style={{ paddingTop: padTop }}
    >
      {slots.map((hour, index) => {
        const first = index === 0;
        const onLine = pinFirstLabel || !first;
        return (
          <div
            key={hour}
            className="relative text-[11px] font-bold text-zinc-300"
            style={{ height: pixelsPerHour }}
          >
            <span
              className={`absolute right-0 ${
                onLine ? 'top-0 -translate-y-1/2' : 'top-1'
              }`}
            >
              {formatMinutesLabel(hour * 60)}
            </span>
          </div>
        );
      })}
      <div className="relative h-0 text-[11px] font-bold text-zinc-300">
        <span className="absolute right-0 top-0 -translate-y-1/2">
          {formatMinutesLabel(lastHour * 60)}
        </span>
      </div>
    </div>
  );
}
