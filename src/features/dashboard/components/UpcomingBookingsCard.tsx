/**
 * UpcomingBookingsCard - Upcoming confirmed appointments
 */

'use client';

import { ROUTES } from '@/constants/routes';
import { DashboardMetricCard } from './DashboardMetricCard';
import React from 'react';

interface UpcomingBookingsCardProps {
  upcomingCount?: number;
}

export const UpcomingBookingsCard: React.FC<UpcomingBookingsCardProps> = ({
  upcomingCount = 0,
}) => {
  return (
    <DashboardMetricCard
      label="Upcoming"
      value={upcomingCount}
      caption={
        upcomingCount === 0
          ? 'No appointments scheduled'
          : `Confirmed on your calendar`
      }
      action={{ label: 'View bookings', href: ROUTES.DASHBOARD.BOOKINGS }}
    />
  );
};

export default UpcomingBookingsCard;
