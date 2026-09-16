'use client';

import type { CalendarMode } from './types';

const OPTIONS: { id: CalendarMode; label: string; title: string }[] = [
  { id: 'list', label: 'List', title: 'List view' },
  { id: 'calendar', label: 'Calendar', title: 'Calendar view' },
];

interface CalendarModeToggleProps {
  value: CalendarMode;
  onChange: (value: CalendarMode) => void;
}

export function CalendarModeToggle({
  value,
  onChange,
}: CalendarModeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Bookings layout"
      className="inline-flex h-9 items-center rounded-full border border-white/12 bg-white/[0.07] p-0.5 sm:h-11 sm:p-1"
    >
      {OPTIONS.map(option => (
        <button
          key={option.id}
          type="button"
          role="tab"
          title={option.title}
          aria-selected={value === option.id}
          onClick={() => onChange(option.id)}
          className={`inline-flex h-8 min-w-[3.75rem] cursor-pointer items-center justify-center rounded-full px-3.5 text-xs font-bold sm:h-9 sm:min-w-[5rem] sm:px-5 sm:text-sm ${
            value === option.id
              ? 'bg-white text-black'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
