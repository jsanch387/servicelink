'use client';

import { formatPaymentDollars } from '@/features/payments/utils/formatPaymentMoney';
import React, { useMemo, useState } from 'react';
import {
  formatBucketHoverLabel,
  type RevenueBucket,
} from '../revenue/summarizeRevenue';
import { zonedYmd } from '../revenue/zonedDateTime';

const WIDTH = 640;
const HEIGHT = 196;
const PAD_X = 18;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

interface PaymentsRevenueAreaChartProps {
  buckets: RevenueBucket[];
}

export function PaymentsRevenueAreaChart({
  buckets,
}: PaymentsRevenueAreaChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const geometry = useMemo(() => chartGeometry(buckets), [buckets]);
  const todayYmd = useMemo(
    () =>
      zonedYmd(
        new Date(),
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      ),
    []
  );
  const active = activeIndex != null ? buckets[activeIndex] : null;
  const activePoint = activeIndex != null ? geometry.points[activeIndex] : null;

  if (buckets.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
        No earnings in this range
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-52 w-full overflow-visible"
        role="img"
        aria-label="Earnings over time"
        onMouseLeave={() => setActiveIndex(null)}
      >
        <defs>
          <linearGradient id="revenue-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(255 255 255)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="rgb(255 255 255)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {geometry.gridY.map(y => (
          <line
            key={y}
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={y}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}
        <path d={geometry.area} fill="url(#revenue-area)" />
        <path
          d={geometry.line}
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {buckets.map((bucket, index) => {
          const point = geometry.points[index];
          if (!point) return null;
          const slotWidth = geometry.slotWidth;
          return (
            <g key={bucket.key}>
              <rect
                x={point.x - slotWidth / 2}
                y={0}
                width={slotWidth}
                height={HEIGHT}
                fill="transparent"
                className="cursor-pointer"
                tabIndex={0}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
              />
              {shouldLabelTick(index, buckets.length) ? (
                <text
                  x={point.x}
                  y={HEIGHT - 8}
                  textAnchor={tickAnchor(index, buckets.length)}
                  className="fill-zinc-500"
                  fontSize="10"
                >
                  {bucket.label}
                </text>
              ) : null}
            </g>
          );
        })}
        {activePoint ? (
          <>
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={PAD_TOP}
              y2={HEIGHT - PAD_BOTTOM}
              stroke="rgba(255,255,255,0.28)"
              strokeDasharray="3 4"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="4.5"
              fill="#0f0f0f"
              stroke="white"
              strokeWidth="2"
            />
          </>
        ) : null}
      </svg>
      {active && activePoint ? (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-white/10 bg-[#161616] px-2.5 py-1.5 shadow-lg"
          style={{
            left: `${(activePoint.x / WIDTH) * 100}%`,
            top: Math.max(0, (activePoint.y / HEIGHT) * 192 - 44),
          }}
        >
          <p className="text-[11px] text-zinc-400">
            {active.hoverLabel ||
              formatBucketHoverLabel(
                active.key,
                active.key.length === 7 ? 'month' : 'day',
                { todayYmd }
              )}
          </p>
          <p className="text-sm font-semibold tabular-nums text-white">
            {formatPaymentDollars(active.totalCents)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function chartGeometry(buckets: RevenueBucket[]) {
  const innerWidth = WIDTH - PAD_X * 2;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const max = Math.max(...buckets.map(bucket => bucket.totalCents), 0);
  const min = Math.min(...buckets.map(bucket => bucket.totalCents), 0);
  const span = Math.max(max - min, 1);
  const count = Math.max(buckets.length, 1);
  const step = count > 1 ? innerWidth / (count - 1) : innerWidth;
  const points = buckets.map((bucket, index) => {
    const x = PAD_X + step * index;
    const y = PAD_TOP + innerHeight * (1 - (bucket.totalCents - min) / span);
    return { x, y };
  });
  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
    .join(' ');
  const baseline = HEIGHT - PAD_BOTTOM;
  const first = points[0];
  const last = points[points.length - 1];
  const area =
    first && last
      ? `${line} L${last.x} ${baseline} L${first.x} ${baseline} Z`
      : '';
  const gridY = [PAD_TOP, PAD_TOP + innerHeight / 2, baseline];
  return { points, line, area, gridY, slotWidth: step };
}

function tickAnchor(index: number, count: number): 'start' | 'middle' | 'end' {
  if (index === 0) return 'start';
  if (index === count - 1) return 'end';
  return 'middle';
}

function shouldLabelTick(index: number, count: number): boolean {
  if (count <= 12) return true;
  if (count <= 16) return index % 2 === 0;
  const step = Math.ceil(count / 7);
  return index % step === 0 || index === count - 1;
}
