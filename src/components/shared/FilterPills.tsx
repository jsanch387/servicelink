'use client';

import React from 'react';

export interface FilterPillOption<T extends string = string> {
  id: T;
  label: string;
}

interface FilterPillsProps<T extends string = string> {
  options: FilterPillOption<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function FilterPills<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel = 'Filters',
  className = '',
}: FilterPillsProps<T>) {
  return (
    <div
      className={`-mx-1 flex gap-1 overflow-x-auto pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map(option => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={`shrink-0 cursor-pointer touch-manipulation rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-white text-black'
                : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.1] hover:text-white'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
