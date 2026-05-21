/**
 * DashboardMetricCard - Stat card for dashboard metrics (GlassCard)
 */

import { Button } from '@/components/shared';
import { dashboardCardButtonClass } from '../utils/dashboardCardStyles';
import { DashboardGlassCard } from './DashboardGlassCard';
import React from 'react';

interface DashboardMetricCardProps {
  label: string;
  value: string | number;
  caption?: string;
  meta?: string;
  action?: { label: string; href: string };
  className?: string;
}

export const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  label,
  value,
  caption,
  meta,
  action,
  className = '',
}) => {
  return (
    <DashboardGlassCard className={className}>
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white">
        {value}
      </p>
      {caption ? (
        <p className="mt-1 text-xs leading-snug text-zinc-500">{caption}</p>
      ) : null}
      {meta ? (
        <p className="mt-auto pt-3 text-xs text-zinc-600">{meta}</p>
      ) : null}
      {action ? (
        <Button
          href={action.href}
          variant="ghost"
          fullWidth
          className={`mt-3 ${dashboardCardButtonClass}`}
        >
          {action.label}
        </Button>
      ) : null}
    </DashboardGlassCard>
  );
};
