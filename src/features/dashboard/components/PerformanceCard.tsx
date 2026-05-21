/**
 * PerformanceCard - Booking page view count
 */

import { DashboardGlassCard } from './DashboardGlassCard';
import { DashboardMetricCard } from './DashboardMetricCard';
import React from 'react';

interface PerformanceCardProps {
  profileViews?: number;
  lastViewed?: string;
  loading?: boolean;
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({
  profileViews = 0,
  lastViewed,
  loading = false,
}) => {
  if (loading) {
    return (
      <DashboardGlassCard>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-20 rounded bg-white/10" />
          <div className="h-9 w-16 rounded bg-white/10" />
          <div className="h-3 w-28 rounded bg-white/10" />
        </div>
      </DashboardGlassCard>
    );
  }

  return (
    <DashboardMetricCard
      label="Page views"
      value={profileViews.toLocaleString()}
      caption="Visitors on your booking link"
      meta={
        lastViewed
          ? `Last viewed ${lastViewed}`
          : profileViews === 0
            ? 'Share your link to start tracking'
            : undefined
      }
    />
  );
};

export default PerformanceCard;
