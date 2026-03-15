/**
 * PendingRequestsCard - Shows pending booking request count with link to Bookings
 * Count is loaded from dashboard data (server-side, scoped to the user's business).
 */

'use client';

import { Button, GlassCard } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface PendingRequestsCardProps {
  /** Pending booking requests count (from dashboard data) */
  pendingCount?: number;
}

export const PendingRequestsCard: React.FC<PendingRequestsCardProps> = ({
  pendingCount = 0,
}) => {
  return (
    <GlassCard
      padding="md"
      rounded="rounded-2xl"
      blurColor="bg-zinc-500"
      showBlur={true}
      className="h-full flex flex-col"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <CalendarDaysIcon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-white">
          Pending Requests
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <p className="text-3xl sm:text-4xl font-bold text-white mb-1">
          {pendingCount}
        </p>
        <p className="text-sm text-gray-400 mb-4">
          New booking request{pendingCount !== 1 ? 's' : ''} awaiting review
        </p>

        <Button
          href={ROUTES.DASHBOARD.BOOKINGS}
          variant="secondary"
          fullWidth
          icon={<CalendarDaysIcon className="h-4 w-4" />}
        >
          View Bookings
        </Button>
      </div>
    </GlassCard>
  );
};

export default PendingRequestsCard;
