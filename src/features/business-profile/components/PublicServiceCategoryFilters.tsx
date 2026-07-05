'use client';

import { horizontalScrollStripClassName } from '@/components/shared/horizontalScrollStrip';
import type { PublicServiceCategoryOption } from '@/features/services/categories/utils/buildPublicServiceCategoryOptions';
import React from 'react';

export interface PublicServiceCategoryFiltersProps {
  options: PublicServiceCategoryOption[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  /** Profile uses wider gutters (px-8); book flow matches max-w-2xl px-6. */
  edgeGutter?: 'profile' | 'bookFlow';
}

/**
 * Rectangular category selectors for the public profile services tab.
 */
export function PublicServiceCategoryFilters({
  options,
  value,
  onChange,
  ariaLabel,
  edgeGutter = 'profile',
}: PublicServiceCategoryFiltersProps) {
  if (options.length === 0) return null;

  const edgeBleedClassName =
    edgeGutter === 'bookFlow'
      ? '-mx-4 flex gap-2 px-4 pb-1 sm:-mx-6 sm:px-6'
      : '-mx-4 flex gap-2 px-4 pb-1 sm:-mx-8 sm:px-8';

  return (
    <div
      className={`${edgeBleedClassName} ${horizontalScrollStripClassName}`}
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
            className={`shrink-0 cursor-pointer touch-manipulation rounded-[10px] border px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
