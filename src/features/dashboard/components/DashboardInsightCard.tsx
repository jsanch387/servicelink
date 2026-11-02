import Link from 'next/link';
import React, { useId } from 'react';
import { DashboardGlassCard } from './DashboardGlassCard';

export type DashboardTrendTone = 'up' | 'down' | 'neutral';

const TONE_CLASS: Record<DashboardTrendTone, string> = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  neutral: 'text-zinc-500',
};

const TREND_STROKE: Record<DashboardTrendTone, string> = {
  up: 'rgb(52 211 153)',
  down: 'rgb(248 113 113)',
  neutral: 'rgb(161 161 170)',
};

/** Soft trend with one pullback. Direction follows the card tone. */
const TREND_POINTS: Record<DashboardTrendTone, { x: number; y: number }[]> = {
  up: [
    { x: 4, y: 44 },
    { x: 44, y: 24 },
    { x: 82, y: 32 },
    { x: 124, y: 8 },
  ],
  down: [
    { x: 4, y: 8 },
    { x: 44, y: 28 },
    { x: 82, y: 20 },
    { x: 124, y: 44 },
  ],
  neutral: [
    { x: 4, y: 28 },
    { x: 44, y: 22 },
    { x: 82, y: 30 },
    { x: 124, y: 24 },
  ],
};

interface DashboardInsightCardProps {
  label: string;
  value: string;
  change?: string;
  tone?: DashboardTrendTone;
  /** Daily or monthly totals for the sparkline. Falls back to the tone shape. */
  trend?: number[];
  href?: string;
  className?: string;
}

export const DashboardInsightCard: React.FC<DashboardInsightCardProps> = ({
  label,
  value,
  change,
  tone = 'neutral',
  trend,
  href,
  className = '',
}) => {
  const card = (
    <DashboardGlassCard className="h-full">
      <div className="flex flex-1 items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col self-stretch">
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-white sm:text-4xl">
            {value}
          </p>
          {change ? (
            <p
              className={`mt-auto pt-5 text-sm font-medium leading-snug ${TONE_CLASS[tone]}`}
            >
              {change}
            </p>
          ) : null}
        </div>
        {change ? <RevenueTrend tone={tone} values={trend} /> : null}
      </div>
    </DashboardGlassCard>
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      className={`block h-full cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white/25 ${className}`}
    >
      {card}
    </Link>
  );
};

function RevenueTrend({
  tone,
  values,
}: {
  tone: DashboardTrendTone;
  values?: number[];
}) {
  const gradientId = useId().replace(/:/g, '');
  const width = 128;
  const height = 52;
  const points =
    values && values.length > 0
      ? plotSeries(values, width, height)
      : TREND_POINTS[tone];
  const line = smoothTrend(points);
  const last = points[points.length - 1];
  const fill = `${line} L ${last.x} ${height} L ${points[0].x} ${height} Z`;
  const stroke = TREND_STROKE[tone];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-12 w-32 shrink-0"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r="3.25" fill={stroke} />
    </svg>
  );
}

function plotSeries(values: number[], width: number, height: number) {
  const padX = 4;
  const padY = 8;
  const samples = values.length === 1 ? [values[0], values[0]] : values;
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const span = max - min;

  return samples.map((value, index) => ({
    x: padX + (index / (samples.length - 1)) * (width - padX * 2),
    y:
      span === 0
        ? height / 2
        : padY + (1 - (value - min) / span) * (height - padY * 2),
  }));
}

function smoothTrend(points: { x: number; y: number }[]) {
  const count = points.length;
  const slope: number[] = [];
  const tangent = new Array<number>(count).fill(0);

  for (let index = 0; index < count - 1; index += 1) {
    const run = points[index + 1].x - points[index].x;
    slope[index] = (points[index + 1].y - points[index].y) / run;
  }

  tangent[0] = slope[0];
  tangent[count - 1] = slope[count - 2];
  for (let index = 1; index < count - 1; index += 1) {
    tangent[index] =
      slope[index - 1] * slope[index] <= 0
        ? 0
        : (slope[index - 1] + slope[index]) / 2;
  }

  for (let index = 0; index < count - 1; index += 1) {
    if (Math.abs(slope[index]) < 1e-6) {
      tangent[index] = 0;
      tangent[index + 1] = 0;
      continue;
    }
    const start = tangent[index] / slope[index];
    const end = tangent[index + 1] / slope[index];
    const scale = Math.hypot(start, end);
    if (scale > 3) {
      const limit = 3 / scale;
      tangent[index] = limit * start * slope[index];
      tangent[index + 1] = limit * end * slope[index];
    }
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < count - 1; index += 1) {
    const run = points[index + 1].x - points[index].x;
    const control1x = points[index].x + run / 3;
    const control1y = points[index].y + (tangent[index] * run) / 3;
    const control2x = points[index + 1].x - run / 3;
    const control2y = points[index + 1].y - (tangent[index + 1] * run) / 3;
    path += ` C ${control1x} ${control1y}, ${control2x} ${control2y}, ${points[index + 1].x} ${points[index + 1].y}`;
  }
  return path;
}
