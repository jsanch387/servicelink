'use client';

import { FilterButton, FilterMenu } from '@/components/shared';

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
    <FilterButton
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={`whitespace-nowrap ${
        pressed ? 'bg-white/10 font-medium text-white' : ''
      } ${className}`}
    >
      {pressed ? 'View all' : 'Assigned to me'}
    </FilterButton>
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
