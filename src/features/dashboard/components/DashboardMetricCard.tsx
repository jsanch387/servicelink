/**
 * DashboardMetricCard - Stat card for dashboard metrics (GlassCard)
 */

import { DashboardGlassCard } from './DashboardGlassCard';
import Link from 'next/link';
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
        <Link
          href={action.href}
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        >
          {action.label}
        </Link>
      ) : null}
    </DashboardGlassCard>
  );
};
