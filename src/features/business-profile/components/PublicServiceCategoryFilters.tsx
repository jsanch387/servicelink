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
 * Rounded category filter pills on the public booking link and profile.
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
      ? '-mx-4 flex gap-2 px-4 sm:-mx-6 sm:px-6'
      : '-mx-4 flex gap-2 px-4 sm:-mx-8 sm:px-8';

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
            className={`shrink-0 cursor-pointer touch-manipulation rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-white text-neutral-950'
                : 'bg-white/[0.08] text-zinc-400 hover:bg-white/[0.14] hover:text-white'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
