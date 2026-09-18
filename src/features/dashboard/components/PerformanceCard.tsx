/**
 * PerformanceCard - Booking link view count (from public_analytics_events)
 */

import {
  ANALYTICS_PERIOD_LABELS,
  type DashboardLinkViewsPeriod,
} from '@/features/analytics/constants';
import React from 'react';
import { dashboardGlassCardLayout } from '../utils/dashboardCardStyles';
import { DashboardGlassCard } from './DashboardGlassCard';
import { LinkViewsPeriodPicker } from './LinkViewsPeriodPicker';

interface PerformanceCardProps {
  views?: number;
  period: DashboardLinkViewsPeriod;
  onPeriodChange: (period: DashboardLinkViewsPeriod) => void;
  lastViewed?: string;
  loading?: boolean;
  isFreeTier?: boolean;
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({
  views = 0,
  period,
  onPeriodChange,
  lastViewed,
  loading = false,
  isFreeTier = false,
}) => {
  if (loading) {
    return (
      <DashboardGlassCard>
        <div className="animate-pulse space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 w-20 rounded bg-white/10" />
            <div className="h-11 w-[6.5rem] rounded-lg bg-white/10" />
          </div>
          <div className="h-9 w-16 rounded bg-white/10" />
          <div className="h-3 w-28 rounded bg-white/10" />
        </div>
      </DashboardGlassCard>
    );
  }

  return (
    <DashboardGlassCard className={dashboardGlassCardLayout}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-zinc-400">Link views</p>
        <LinkViewsPeriodPicker
          period={period}
          onPeriodChange={onPeriodChange}
          isFreeTier={isFreeTier}
        />
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white">
        {views.toLocaleString()}
      </p>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <p className="text-xs leading-snug text-zinc-500">
          {ANALYTICS_PERIOD_LABELS[period]}
        </p>
        {lastViewed && lastViewed !== 'Never' ? (
          <p className="shrink-0 text-xs leading-snug text-zinc-500">
            {lastViewed}
          </p>
        ) : null}
      </div>
    </DashboardGlassCard>
  );
};

export default PerformanceCard;
