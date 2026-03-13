/**
 * FreeBookingsTracker - Small inline indicator: X of 5 free bookings + upgrade link.
 * Shown on dashboard for free users. No card; minimal footprint.
 */

'use client';

import { ROUTES } from '@/constants/routes';
import { TicketIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';
import { FREE_BOOKINGS_LIMIT } from '../types';

interface FreeBookingsTrackerProps {
  /** Number of free bookings used this month (0–5). From API later. */
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
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${className}`.trim()}
    >
      <TicketIcon className="h-4 w-4 text-amber-400/80 flex-shrink-0" />
      <span className="text-gray-400">
        <span className="text-white font-medium">{bookingsUsed}</span>
        <span className="text-gray-500"> / {FREE_BOOKINGS_LIMIT}</span>
        <span className="text-gray-400"> free bookings this month</span>
      </span>
      <span className="text-gray-600">·</span>
      <Link
        href={ROUTES.DASHBOARD.UPGRADE}
        className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
      >
        {atLimit ? 'Upgrade for unlimited' : 'Upgrade'}
      </Link>
    </div>
  );
};

export default FreeBookingsTracker;
