'use client';

import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import React from 'react';
import { FREE_BOOKINGS_LIMIT } from '../types';

interface FreeBookingsTrackerProps {
  /** Public bookings counted toward the Free plan lifetime cap (0–FREE_BOOKINGS_LIMIT). */
  bookingsUsed?: number;
  className?: string;
}

/**
 * Free-plan usage strip — dark card, `n / limit` + “free bookings”, upgrade link on the right.
 */
export const FreeBookingsTracker: React.FC<FreeBookingsTrackerProps> = ({
  bookingsUsed = 0,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 sm:px-4 sm:py-3.5 ${className}`.trim()}
    >
      <div className="flex flex-row items-center justify-between gap-3">
        <p className="min-w-0 text-sm leading-tight">
          <span className="font-bold tabular-nums text-white">
            {bookingsUsed}
          </span>
          <span className="font-bold tabular-nums text-white/75">
            {' '}
            / {FREE_BOOKINGS_LIMIT}
          </span>
          <span className="font-medium text-zinc-500"> free bookings</span>
        </p>

        <Link
          href={ROUTES.DASHBOARD.UPGRADE}
          className="shrink-0 text-xs font-semibold text-zinc-400 underline-offset-2 transition-colors hover:text-white hover:underline"
        >
          Upgrade
        </Link>
      </div>
    </div>
  );
};

export default FreeBookingsTracker;
