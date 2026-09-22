'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { CalendarRange } from './types';

const RANGES: { id: CalendarRange; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

interface CalendarToolbarProps {
  title: string;
  range: CalendarRange;
  isToday: boolean;
  onRangeChange: (range: CalendarRange) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarToolbar({
  title,
  range,
  isToday,
  onRangeChange,
  onPrev,
  onNext,
  onToday,
}: CalendarToolbarProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-y-3">
      <button
        type="button"
        onClick={onToday}
        disabled={isToday}
        className={`col-start-3 row-start-1 h-8 justify-self-end rounded-full px-3 text-xs font-bold sm:col-start-1 sm:h-9 sm:justify-self-start sm:px-3.5 ${
          isToday
            ? 'cursor-not-allowed text-zinc-500'
            : 'cursor-pointer text-zinc-200 hover:bg-white/10 hover:text-white'
        }`}
      >
        Today
      </button>

      <div className="col-start-2 row-start-1 flex min-w-0 items-center justify-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous"
          title="Previous"
          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-300 hover:bg-white/10 hover:text-white"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <h2 className="min-w-0 truncate px-1 text-lg font-bold tracking-tight text-white sm:text-xl">
          {title}
        </h2>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next"
          title="Next"
          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-300 hover:bg-white/10 hover:text-white"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Calendar range"
        className="col-span-3 row-start-2 flex h-9 w-full items-center rounded-lg border border-white/12 bg-white/[0.07] p-0.5 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:w-auto sm:justify-self-end"
      >
        {RANGES.map(option => {
          const selected = range === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onRangeChange(option.id)}
              className={`h-8 min-w-0 flex-1 cursor-pointer rounded-md px-3.5 text-xs font-bold sm:min-w-[3.75rem] sm:flex-none ${
                selected
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
