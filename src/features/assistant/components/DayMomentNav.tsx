import React from 'react';

import { DAY_MOMENTS, type DayMoment } from '../types';

export function DayMomentNav({
  moment,
  onChange,
}: {
  moment: DayMoment;
  onChange: (moment: DayMoment) => void;
}) {
  return (
    <div
      className="-mx-1 flex gap-1 overflow-x-auto px-1 scrollbar-hide"
      role="tablist"
      aria-label="Sample day"
    >
      {DAY_MOMENTS.map(item => {
        const active = item.id === moment;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-xs transition-colors ${
              active
                ? 'bg-white/10 text-white'
                : 'text-zinc-600 hover:text-zinc-300'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
