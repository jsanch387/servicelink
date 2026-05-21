/**
 * PendingRequestsCard - Pending booking requests
 */

'use client';

import { ROUTES } from '@/constants/routes';
import { DashboardMetricCard } from './DashboardMetricCard';
import React from 'react';

interface PendingRequestsCardProps {
  pendingCount?: number;
}

export const PendingRequestsCard: React.FC<PendingRequestsCardProps> = ({
  pendingCount = 0,
}) => {
  return (
    <DashboardMetricCard
      label="Pending"
      value={pendingCount}
      caption={
        pendingCount === 0
          ? 'Nothing awaiting review'
          : `Request${pendingCount !== 1 ? 's' : ''} need your response`
      }
      action={{ label: 'View bookings', href: ROUTES.DASHBOARD.BOOKINGS }}
    />
  );
};

export default PendingRequestsCard;
