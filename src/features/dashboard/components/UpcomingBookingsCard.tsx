/**
 * UpcomingBookingsCard - V2: shows upcoming (confirmed) appointment count with link to Bookings
 * Shown when the business uses availability booking (V2). Count from dashboard data.
 */

'use client';

import { Button, GlassCard } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface UpcomingBookingsCardProps {
  /** Upcoming confirmed bookings count (from dashboard data) */
  upcomingCount?: number;
}

export const UpcomingBookingsCard: React.FC<UpcomingBookingsCardProps> = ({
  upcomingCount = 0,
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
        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CalendarDaysIcon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-white">
          Upcoming Appointments
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <p className="text-3xl sm:text-4xl font-bold text-white mb-1">
          {upcomingCount}
        </p>
        <p className="text-sm text-gray-400 mb-4">
          {upcomingCount === 0
            ? 'No upcoming appointments. New bookings will appear here.'
            : `Scheduled appointment${upcomingCount !== 1 ? 's' : ''}. View details in Bookings.`}
        </p>

        <Button
          href={ROUTES.DASHBOARD.BOOKINGS}
          variant="secondary"
          size="md"
          fullWidth
          icon={<CalendarDaysIcon className="h-4 w-4" />}
        >
          View Bookings
        </Button>
      </div>
    </GlassCard>
  );
};

export default UpcomingBookingsCard;
