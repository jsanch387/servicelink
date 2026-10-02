'use client';

import { formatPaymentDollars } from '@/features/payments/utils/formatPaymentMoney';
import React, {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  formatBucketHoverLabel,
  type RevenueBucket,
} from '../revenue/summarizeRevenue';
import { zonedYmd } from '../revenue/zonedDateTime';

const PAD_LEFT = 56;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 46;

interface PaymentsRevenueAreaChartProps {
  buckets: RevenueBucket[];
  /** Tailwind height class for the chart frame. Defaults to the payments page size. */
  heightClassName?: string;
}

export function PaymentsRevenueAreaChart({
  buckets,
  heightClassName = 'h-52',
}: PaymentsRevenueAreaChartProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const gradientId = `revenue-area-${useId().replace(/:/g, '')}`;
  const geometry = useMemo(
    () =>
      size.width > 0 && size.height > 0
        ? chartGeometry(buckets, size.width, size.height)
        : null,
    [buckets, size.height, size.width]
  );
  const todayYmd = useMemo(
    () =>
      zonedYmd(
        new Date(),
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      ),
    []
  );
  const active = activeIndex != null ? buckets[activeIndex] : null;
  const activePoint =
    activeIndex != null ? geometry?.points[activeIndex] : null;

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const next = { width: frame.clientWidth, height: frame.clientHeight };
      setSize(prev =>
        prev.width === next.width && prev.height === next.height ? prev : next
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  if (buckets.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-sm text-zinc-500 ${heightClassName}`}
      >
        No earnings in this range
      </div>
    );
  }

  return (
    <div ref={frameRef} className={`relative w-full ${heightClassName}`}>
      {geometry && size.width > 0 ? (
        <svg
          viewBox={`0 0 ${size.width} ${size.height}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Earnings over time"
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="rgb(52 211 153)"
                stopOpacity="0.34"
              />
              <stop
                offset="45%"
                stopColor="rgb(52 211 153)"
                stopOpacity="0.08"
              />
              <stop offset="100%" stopColor="rgb(52 211 153)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {geometry.ticks.map(tick => (
            <g key={tick.cents}>
              <line
                x1={PAD_LEFT}
                x2={size.width - PAD_RIGHT}
                y1={tick.y}
                y2={tick.y}
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="1"
                strokeDasharray="2 5"
              />
              <text
                x={PAD_LEFT - 8}
                y={tick.y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-zinc-300"
                fontSize="14"
              >
                {tick.label}
              </text>
            </g>
          ))}
          <path d={geometry.area} fill={`url(#${gradientId})`} />
          <path
            d={geometry.line}
            fill="none"
            stroke="rgb(52 211 153)"
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
                  height={size.height}
                  fill="transparent"
                  className="cursor-pointer"
                  tabIndex={0}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                />
                {shouldLabelTick(index, buckets.length) ? (
                  <text
                    x={point.x}
                    y={size.height - 6}
                    textAnchor={tickAnchor(index, buckets.length)}
                    className="fill-zinc-300"
                    fontSize="14"
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
                y2={geometry.baseline}
                stroke="rgba(52,211,153,0.45)"
                strokeDasharray="3 4"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="8"
                fill="rgba(52,211,153,0.22)"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="4"
                fill="#0f0f0f"
                stroke="rgb(52 211 153)"
                strokeWidth="2"
              />
            </>
          ) : null}
        </svg>
      ) : null}
      {active && activePoint && size.width > 0 ? (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-[#161616] px-2.5 py-1.5 shadow-lg"
          style={{
            left: `${(activePoint.x / size.width) * 100}%`,
            top: `${(activePoint.y / size.height) * 100}%`,
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

function chartGeometry(
  buckets: RevenueBucket[],
  width: number,
  height: number
) {
  const plotRight = width - PAD_RIGHT;
  const innerWidth = Math.max(plotRight - PAD_LEFT, 1);
  const baseline = height - PAD_BOTTOM;
  const innerHeight = Math.max(baseline - PAD_TOP, 1);
  const dataMax = Math.max(...buckets.map(bucket => bucket.totalCents), 0);
  const ticks = axisTicks(dataMax).map(cents => ({
    cents,
    y: yForCents(cents, axisMaxCents(dataMax), innerHeight),
    label: formatAxisDollars(cents),
  }));
  const axisMax = axisMaxCents(dataMax);
  const count = Math.max(buckets.length, 1);
  const step = count > 1 ? innerWidth / (count - 1) : innerWidth;
  const points = buckets.map((bucket, index) => ({
    x: PAD_LEFT + step * index,
    y: yForCents(bucket.totalCents, axisMax, innerHeight),
  }));
  const line = smoothLine(points);
  const first = points[0];
  const last = points[points.length - 1];
  const area =
    first && last
      ? `${line} L${last.x} ${baseline} L${first.x} ${baseline} Z`
      : '';
  return { points, line, area, ticks, baseline, slotWidth: step };
}

function smoothLine(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M${points[0].x} ${points[0].y} L${points[1].x} ${points[1].y}`;
  }

  const slopes = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    const dx = next.x - point.x || 1;
    return (next.y - point.y) / dx;
  });
  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes[slopes.length - 1];
    const previous = slopes[index - 1];
    const next = slopes[index];
    if (previous * next <= 0) return 0;
    return (previous + next) / 2;
  });

  for (let index = 0; index < slopes.length; index += 1) {
    const slope = slopes[index];
    if (slope === 0) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      continue;
    }
    const start = tangents[index] / slope;
    const end = tangents[index + 1] / slope;
    const magnitude = start * start + end * end;
    if (magnitude > 9) {
      const scale = 3 / Math.sqrt(magnitude);
      tangents[index] = scale * start * slope;
      tangents[index + 1] = scale * end * slope;
    }
  }

  let path = `M${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const dx = (next.x - current.x) / 3;
    path += ` C${current.x + dx} ${current.y + tangents[index] * dx} ${next.x - dx} ${next.y - tangents[index + 1] * dx} ${next.x} ${next.y}`;
  }
  return path;
}

function yForCents(cents: number, axisMax: number, innerHeight: number) {
  return PAD_TOP + innerHeight * (1 - cents / axisMax);
}

function axisMaxCents(maxCents: number) {
  const maxDollars = Math.max(maxCents / 100, 0);
  const top = maxDollars === 0 ? 100 : niceCeil(maxDollars);
  return Math.round(top * 100);
}

function axisTicks(maxCents: number) {
  const top = axisMaxCents(maxCents);
  return [0, top / 2, top];
}

function niceCeil(value: number) {
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const fraction = value / exp;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * exp;
}

function formatAxisDollars(cents: number) {
  const dollars = cents / 100;
  const absolute = Math.abs(dollars);
  if (absolute >= 1000) {
    const thousands = dollars / 1000;
    const rounded = Math.round(thousands * 10) / 10;
    const text = Number.isInteger(rounded)
      ? String(rounded)
      : rounded.toFixed(1);
    return `$${text}k`;
  }
  if (Number.isInteger(dollars)) {
    return `$${dollars.toLocaleString('en-US')}`;
  }
  return `$${dollars.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}`;
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
