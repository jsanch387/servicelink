'use client';

import type { ReactNode } from 'react';

interface PreviewActionBarProps {
  compact: boolean;
  children: ReactNode;
}

/** Primary action pinned to the bottom of the preview column. */
export function PreviewActionBar({ compact, children }: PreviewActionBarProps) {
  return (
    <div
      className={
        compact
          ? 'sticky bottom-0 z-10 -mx-4 mt-10 px-4'
          : 'sticky bottom-0 z-10 -mx-4 mt-10 px-4 sm:static sm:mx-0 sm:mt-8 sm:px-0'
      }
    >
      <div
        className={
          compact
            ? 'pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-[#0f0f0f] to-transparent'
            : 'pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-[#0f0f0f] to-transparent sm:hidden'
        }
        aria-hidden
      />
      <div
        className={
          compact
            ? 'bg-[#0f0f0f] pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]'
            : 'bg-[#0f0f0f] pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:bg-transparent sm:p-0'
        }
      >
        {children}
      </div>
    </div>
  );
}
