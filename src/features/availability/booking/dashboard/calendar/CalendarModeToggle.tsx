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
      className="inline-flex h-10 w-fit shrink-0 items-center self-start rounded-[10px] border border-white/15 bg-white/[0.03] p-0.5"
    >
      {OPTIONS.map(option => (
        <button
          key={option.id}
          type="button"
          role="tab"
          title={option.title}
          aria-selected={value === option.id}
          onClick={() => onChange(option.id)}
          className={`inline-flex h-8 min-w-[4.5rem] cursor-pointer items-center justify-center rounded-[8px] px-3.5 text-sm font-medium ${
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
