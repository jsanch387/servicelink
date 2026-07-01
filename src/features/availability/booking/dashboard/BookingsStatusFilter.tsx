'use client';

import { ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';

export type BookingsStatusFilterValue = 'upcoming' | 'past' | 'cancelled';

const OPTIONS: { value: BookingsStatusFilterValue; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

const selectTriggerClasses = `
  cursor-pointer rounded-lg border border-white/[0.09] bg-white/[0.04] text-xs font-semibold text-white
  transition-colors hover:border-white/[0.14] hover:bg-white/[0.06]
  focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2
  focus-visible:ring-offset-[#0f0f0f] [-webkit-tap-highlight-color:transparent]
`;

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
      <div
        className={`
          relative h-8 w-8 shrink-0 [-webkit-tap-highlight-color:transparent] md:inline-block md:h-auto
          md:w-auto md:min-w-[8.5rem]
        `}
      >
        <select
          id="bookings-status-filter"
          value={value}
          onChange={e => onChange(e.target.value as BookingsStatusFilterValue)}
          className={`
            ${selectTriggerClasses}
            absolute inset-0 z-10 h-full w-full min-w-0 appearance-none opacity-0
            md:relative md:inset-auto md:z-auto md:min-h-0 md:min-w-[8.5rem] md:py-1.5 md:pl-2.5 md:pr-7
            md:opacity-100
          `}
        >
          {OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.04] text-gray-300 md:hidden"
          aria-hidden
        >
          <FunnelIcon className="h-4 w-4" />
        </div>
        <ChevronDownIcon
          className="pointer-events-none absolute right-2 top-1/2 z-0 hidden h-3.5 w-3.5 -translate-y-1/2 text-gray-400 md:block"
          aria-hidden
        />
      </div>
    </div>
  );
}
