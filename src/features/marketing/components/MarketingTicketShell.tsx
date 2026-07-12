'use client';

import React from 'react';

/** Matches `BusinessProfileView` page background so side notches blend in. */
const PROFILE_PAGE_BG = '#0f0f0f';

const NOTCH_SIZE =
  'pointer-events-none absolute top-1/2 z-20 h-5 w-5 -translate-y-1/2 rounded-full sm:h-[22px] sm:w-[22px]';

interface MarketingTicketShellProps {
  children: React.ReactNode;
}

/** Shared coupon/ticket frame: symmetric side punches + vertical perforation. */
export function MarketingTicketShell({ children }: MarketingTicketShellProps) {
  return (
    <div className="relative">
      <div
        className={`${NOTCH_SIZE} left-0 -translate-x-1/2`}
        style={{ backgroundColor: PROFILE_PAGE_BG }}
        aria-hidden
      />
      <div
        className={`${NOTCH_SIZE} right-0 translate-x-1/2`}
        style={{ backgroundColor: PROFILE_PAGE_BG }}
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-50/98 shadow-[0_6px_28px_rgba(0,0,0,0.22)] sm:rounded-2xl">
        <div
          className="pointer-events-none absolute inset-y-4 right-[30%] w-px border-l border-dashed border-zinc-200 sm:right-[31%]"
          aria-hidden
        />
        {children}
      </div>
    </div>
  );
}

/** Left body panel — equal horizontal padding. */
export const MARKETING_TICKET_BODY_CLASS =
  'min-w-0 flex-1 px-4 py-3 sm:px-6 sm:py-5';

/** Discount stub panel — width matches perforation split. */
export const MARKETING_TICKET_STUB_CLASS =
  'flex w-[30%] min-w-[4.75rem] shrink-0 items-center justify-center border-l border-dashed border-zinc-200/80 bg-zinc-100/45 px-4 py-3 sm:w-[32%] sm:min-w-0 sm:px-6 sm:py-5';
