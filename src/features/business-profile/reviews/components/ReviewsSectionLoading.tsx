'use client';

import React from 'react';

interface ReviewsSectionLoadingProps {
  ariaLabel: string;
}

export const ReviewsSectionLoading: React.FC<ReviewsSectionLoadingProps> = ({
  ariaLabel,
}) => {
  return (
    <ul
      className="-mx-4 divide-y divide-white/[0.06] border-t border-white/[0.06] sm:-mx-8"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {[0, 1, 2].map(i => (
        <li key={i} className="px-4 py-6 sm:px-8 sm:py-8">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 rounded bg-white/[0.08]" />
            <div className="h-3 w-20 rounded bg-white/[0.06]" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded bg-white/[0.06]" />
              <div className="h-3 w-[80%] rounded bg-white/[0.06]" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
