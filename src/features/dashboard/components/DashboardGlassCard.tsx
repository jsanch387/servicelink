/**
 * DashboardGlassCard - Dashboard layout on top of shared GlassCard
 */

import { GlassCard } from '@/components/shared';
import { dashboardGlassCardLayout } from '../utils/dashboardCardStyles';
import React from 'react';

interface DashboardGlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  /** Grid stat/shortcut cards use min-height; full-width link cards do not. */
  fillGridCell?: boolean;
}

export const DashboardGlassCard: React.FC<DashboardGlassCardProps> = ({
  children,
  className = '',
  padding = 'md',
  fillGridCell = true,
}) => {
  return (
    <GlassCard
      rounded="rounded-2xl"
      padding={padding}
      showBlur={false}
      className={`${fillGridCell ? dashboardGlassCardLayout : ''} lg:p-5 ${className}`.trim()}
    >
      {children}
    </GlassCard>
  );
};
