'use client';

import { FilterMenu } from '@/components/shared';

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

export interface BookingsAssignedToMeFilterProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  className?: string;
}

export function BookingsAssignedToMeFilter({
  pressed,
  onPressedChange,
  className = '',
}: BookingsAssignedToMeFilterProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={`inline-flex h-10 cursor-pointer items-center whitespace-nowrap rounded-[10px] border border-white/15 px-3.5 text-sm transition-colors hover:bg-white/[0.04] ${
        pressed
          ? 'bg-white/10 font-medium text-white'
          : 'text-gray-200 hover:border-white/30'
      } ${className}`}
    >
      {pressed ? 'View all' : 'Assigned to me'}
    </button>
  );
}

export function BookingsStatusFilter({
  value,
  onChange,
  className = '',
}: BookingsStatusFilterProps) {
  return (
    <div className={className}>
      <FilterMenu
        options={OPTIONS.map(option => ({
          id: option.value,
          label: option.label,
        }))}
        value={value}
        onChange={onChange}
        menuLabel="Appointments"
      />
    </div>
  );
}
