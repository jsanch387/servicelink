'use client';

import { ChevronDownIcon } from '@heroicons/react/24/outline';

export type BookingsStatusFilterValue = 'upcoming' | 'past' | 'cancelled';

const OPTIONS: { value: BookingsStatusFilterValue; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

export interface BookingsStatusFilterProps {
  value: BookingsStatusFilterValue;
  onChange: (value: BookingsStatusFilterValue) => void;
  className?: string;
}

export function BookingsStatusFilter({
  value,
  onChange,
  className = '',
}: BookingsStatusFilterProps) {
  return (
    <div className={className}>
      <label htmlFor="bookings-status-filter" className="sr-only">
        Filter appointments
      </label>
      <div className="relative inline-block w-[8.5rem] [-webkit-tap-highlight-color:transparent]">
        <select
          id="bookings-status-filter"
          value={value}
          onChange={e => onChange(e.target.value as BookingsStatusFilterValue)}
          className="w-full cursor-pointer appearance-none rounded-lg border border-white/[0.09] bg-white/[0.04] py-1.5 pl-2.5 pr-7 text-xs font-semibold text-white outline-none transition-colors hover:border-white/[0.14] hover:bg-white/[0.06] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [-webkit-tap-highlight-color:transparent]"
        >
          {OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
      </div>
    </div>
  );
}
