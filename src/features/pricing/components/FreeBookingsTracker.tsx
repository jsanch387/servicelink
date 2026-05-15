'use client';

import { ROUTES } from '@/constants/routes';
import { TicketIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';
import { FREE_BOOKINGS_LIMIT } from '../types';

interface FreeBookingsTrackerProps {
  /** Number of Free-plan bookings used (lifetime cap). */
  bookingsUsed?: number;
  className?: string;
}

export const FreeBookingsTracker: React.FC<FreeBookingsTrackerProps> = ({
  bookingsUsed = 0,
  className = '',
}) => {
  const atLimit = bookingsUsed >= FREE_BOOKINGS_LIMIT;

  return (
    <div
      className={`flex flex-row items-center justify-between gap-2 text-sm ${className}`.trim()}
    >
      <div className="flex flex-col items-start gap-0.5">
        <div className="inline-flex items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1">
          <TicketIcon className="h-3.5 w-3.5 text-amber-400/90 mr-1.5" />
          <span className="text-xs font-medium text-amber-100">
            {bookingsUsed} / {FREE_BOOKINGS_LIMIT}
          </span>
        </div>
        <span className="text-[11px] sm:text-xs text-gray-500">
          Free plan bookings (lifetime)
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {atLimit && (
          <span className="text-[11px] sm:text-xs text-gray-400">
            Limit reached
          </span>
        )}
        <Link
          href={ROUTES.DASHBOARD.UPGRADE}
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline transition-colors"
        >
          Upgrade
        </Link>
      </div>
    </div>
  );
};

export default FreeBookingsTracker;
