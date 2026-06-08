'use client';

import React from 'react';
import { horizontalScrollStripClassName } from './horizontalScrollStrip';

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
  compactOnMobile?: boolean;
  /** Keep a single scrollable row (no wrap) when many options. */
  horizontalScroll?: boolean;
}

export function FilterPills<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel = 'Filters',
  className = '',
  compactOnMobile = false,
  horizontalScroll = false,
}: FilterPillsProps<T>) {
  return (
    <div
      className={
        horizontalScroll
          ? `-mx-1 flex gap-1 px-1 pb-1 ${horizontalScrollStripClassName} ${className}`.trim()
          : `-mx-1 flex gap-1 overflow-x-auto scrollbar-hide pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible ${className}`.trim()
      }
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
            className={`shrink-0 cursor-pointer touch-manipulation rounded-full font-medium transition-colors ${
              compactOnMobile
                ? 'px-2.5 py-1.5 text-xs sm:px-3.5 sm:py-2 sm:text-sm'
                : 'px-3.5 py-2 text-sm'
            } ${
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
