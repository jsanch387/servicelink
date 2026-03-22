'use client';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { forwardRef, useLayoutEffect, useMemo, useRef } from 'react';
import {
  DAY_PLANNER_DEFAULT_DURATION_MIN,
  addDaysToDateKey,
  formatPlannerDayTitle,
  isDateKeyToday,
  parseTimeToMinutesFromDisplay,
} from './dayPlannerUtils';
import type { AvailabilityBookingDisplay } from './types';

/** First hour row label (inclusive). */
const START_HOUR = 6;
/** Last hour row label (inclusive). */
const END_HOUR = 21;
/** Tighter rows → faster vertical scan. */
const PIXELS_PER_HOUR = 52;
const MIN_BLOCK_PX = 36;

/** One line, no line break between time and AM/PM (locale can wrap "12:00" + "AM"). */
function hourLabel(h: number): string {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  const s = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return s.replace(/\s+/g, '\u00A0');
}

function shortStreet(booking: AvailabilityBookingDisplay): string {
  const { address } = booking;
  return (
    address.street ||
    [address.city, address.state].filter(Boolean).join(', ') ||
    ''
  );
}

function statusAccentClass(
  status: AvailabilityBookingDisplay['status']
): string {
  if (status === 'confirmed') return 'border-l-2 border-l-emerald-500/80';
  if (status === 'completed') return 'border-l-2 border-l-zinc-500/70';
  return 'border-l-2 border-l-rose-500/80';
}

export interface DayPlannerViewProps {
  dateKey: string;
  onDateKeyChange: (next: string) => void;
  dayBookings: AvailabilityBookingDisplay[];
  onSelectBooking: (booking: AvailabilityBookingDisplay) => void;
}

export function DayPlannerView({
  dateKey,
  onDateKeyChange,
  dayBookings,
  onSelectBooking,
}: DayPlannerViewProps) {
  /** Scroll document so "now" is visible when viewing today (no nested timeline scroll). */
  const nowAnchorRef = useRef<HTMLDivElement>(null);

  const numHours = END_HOUR - START_HOUR + 1;
  const timelineHeightPx = numHours * PIXELS_PER_HOUR;
  const windowStartMin = START_HOUR * 60;
  const windowEndMin = (END_HOUR + 1) * 60;
  const windowSpanMin = windowEndMin - windowStartMin;
  const pxPerMinute = timelineHeightPx / windowSpanMin;

  const hours = useMemo(
    () => Array.from({ length: numHours }, (_, i) => START_HOUR + i),
    [numHours]
  );

  const placed = useMemo(() => {
    const items: {
      booking: AvailabilityBookingDisplay;
      top: number;
      height: number;
    }[] = [];

    for (const booking of dayBookings) {
      const startM = parseTimeToMinutesFromDisplay(booking.time);
      if (startM == null) continue;
      const rawDur =
        booking.serviceDurationMinutes > 0
          ? booking.serviceDurationMinutes
          : DAY_PLANNER_DEFAULT_DURATION_MIN;
      const endM = startM + rawDur;
      const visStart = Math.max(startM, windowStartMin);
      const visEnd = Math.min(endM, windowEndMin);
      if (visEnd <= visStart) continue;
      const top = (visStart - windowStartMin) * pxPerMinute;
      const height = Math.max((visEnd - visStart) * pxPerMinute, MIN_BLOCK_PX);
      items.push({ booking, top, height });
    }

    items.sort((a, b) => a.top - b.top || a.height - b.height);
    return items;
  }, [dayBookings, pxPerMinute, windowEndMin, windowStartMin]);

  useLayoutEffect(() => {
    if (!isDateKeyToday(dateKey)) return;
    const node = nowAnchorRef.current;
    if (!node) return;
    node.scrollIntoView({ block: 'center', behavior: 'auto' });
  }, [dateKey]);

  const title = formatPlannerDayTitle(dateKey);

  return (
    <div className="pb-20 sm:pb-24 w-full">
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <button
          type="button"
          onClick={() => onDateKeyChange(addDaysToDateKey(dateKey, -1))}
          className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
          aria-label="Previous day"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 text-center px-2 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors cursor-pointer"
          aria-label={`Selected day ${title}. Date picker coming soon.`}
        >
          <span className="block truncate text-center text-base font-bold tracking-tight text-white sm:text-lg">
            {title}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onDateKeyChange(addDaysToDateKey(dateKey, 1))}
          className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
          aria-label="Next day"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {!dayBookings.length && (
        <p className="text-gray-500 text-sm mb-3">
          No appointments on this day.
        </p>
      )}

      <div className="flex min-w-0">
        <div
          className="w-[3.35rem] shrink-0 border-r border-white/[0.06] bg-[#0f0f0f] sm:w-[5.25rem] sm:border-white/[0.05]"
          aria-hidden
        >
          {hours.map(h => (
            <div
              key={h}
              className="flex items-start justify-end pl-1 pr-1 sm:pl-1.5 sm:pr-2 text-[10px] sm:text-[11px] font-medium text-gray-500 tabular-nums leading-none"
              style={{ height: PIXELS_PER_HOUR }}
            >
              <span className="whitespace-nowrap pt-px">{hourLabel(h)}</span>
            </div>
          ))}
        </div>

        <div
          className="relative min-w-0 flex-1 bg-[#0f0f0f]"
          style={{ height: timelineHeightPx }}
        >
          {hours.map((h, i) => (
            <div
              key={h}
              className="pointer-events-none absolute left-0 right-0 h-px bg-white/[0.06]"
              style={{ top: i * PIXELS_PER_HOUR }}
            />
          ))}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-white/[0.06]" />

          {isDateKeyToday(dateKey) && (
            <NowIndicator
              ref={nowAnchorRef}
              windowStartMin={windowStartMin}
              pxPerMinute={pxPerMinute}
              timelineHeightPx={timelineHeightPx}
            />
          )}

          {placed.map(({ booking, top, height }) => {
            const addr = shortStreet(booking);
            const isCancelled = booking.status === 'cancelled';
            return (
              <button
                key={booking.id}
                type="button"
                onClick={() => onSelectBooking(booking)}
                aria-label={
                  isCancelled
                    ? `${booking.customerName}, cancelled appointment`
                    : undefined
                }
                className={`absolute left-1 right-1 sm:left-1.5 sm:right-1.5 rounded-lg sm:rounded-xl border-y border-r px-1.5 py-1 transition-colors overflow-hidden flex flex-col cursor-pointer text-left ${statusAccentClass(booking.status)} ${
                  isCancelled
                    ? 'border-white/[0.05] bg-[#121212] opacity-[0.92] hover:bg-[#161616] hover:opacity-100'
                    : 'border-white/[0.08] bg-[#1a1a1a] hover:bg-[#222222]'
                }`}
                style={{ top, height, minHeight: MIN_BLOCK_PX }}
              >
                <div className="flex min-w-0 items-start justify-between gap-1">
                  <span
                    className={`min-w-0 font-semibold text-[13px] leading-snug line-clamp-2 ${
                      isCancelled ? 'text-white/45' : 'text-white'
                    }`}
                  >
                    {booking.customerName}
                  </span>
                  {isCancelled ? (
                    <span className="shrink-0 rounded-md bg-rose-500/20 px-1 py-0.5 text-[8px] font-semibold leading-none text-rose-400 sm:px-1.5 sm:text-[9px]">
                      Cancelled
                    </span>
                  ) : null}
                </div>
                <span
                  className={`mt-0.5 line-clamp-1 text-[11px] leading-tight ${
                    isCancelled ? 'text-white/30' : 'text-white/65'
                  }`}
                >
                  {booking.serviceName}
                </span>
                {addr ? (
                  <span
                    className={`mt-auto flex min-h-0 items-start gap-0.5 pt-0.5 text-[10px] leading-tight ${
                      isCancelled ? 'text-white/22' : 'text-white/45'
                    }`}
                  >
                    <MapPinIcon
                      className={`h-2.5 w-2.5 flex-shrink-0 mt-px ${
                        isCancelled ? 'opacity-50' : 'opacity-80'
                      }`}
                    />
                    <span className="line-clamp-2">{addr}</span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const NowIndicator = forwardRef<
  HTMLDivElement,
  {
    windowStartMin: number;
    pxPerMinute: number;
    timelineHeightPx: number;
  }
>(function NowIndicator(
  { windowStartMin, pxPerMinute, timelineHeightPx },
  ref
) {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const top = (mins - windowStartMin) * pxPerMinute;
  if (top < 0 || top > timelineHeightPx) return null;
  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 z-10 pointer-events-none flex items-center scroll-mt-24 sm:scroll-mt-28"
      style={{ top }}
      aria-hidden
    >
      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 -translate-x-px" />
      <div className="flex-1 h-px bg-rose-500/75" />
    </div>
  );
});

NowIndicator.displayName = 'NowIndicator';
