'use client';

import { isDateKeyToday } from '../dayPlannerUtils';
import { DAY_END_HOUR } from './timeGrid';

interface CalendarNowLineProps {
  dateKey: string;
  startHour: number;
  pixelsPerHour: number;
}

export function CalendarNowLine({
  dateKey,
  startHour,
  pixelsPerHour,
}: CalendarNowLineProps) {
  if (!isDateKeyToday(dateKey)) return null;

  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const startMin = startHour * 60;
  const endMin = DAY_END_HOUR * 60;
  if (minutes < startMin || minutes > endMin) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 right-0 z-20"
      style={{ top: ((minutes - startMin) / 60) * pixelsPerHour }}
    >
      <div className="flex items-center">
        <span className="-ml-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
        <span className="h-px flex-1 bg-orange-400/80" />
      </div>
    </div>
  );
}
