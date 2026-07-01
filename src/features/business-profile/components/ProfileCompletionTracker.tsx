'use client';

import { CheckIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface CompletionCheck {
  label: string;
  done: boolean;
}

interface ProfileCompletionTrackerProps {
  checks: readonly CompletionCheck[];
  onViewChecklist: () => void;
  /** View/preview: flush with max-w profile edges on lg+ (no side inset). */
  fullWidthOnLarge?: boolean;
}

const RING_SIZE = 36;
const STROKE_WIDTH = 3;

function progressColor(percent: number): string {
  if (percent >= 75) return 'text-emerald-400';
  if (percent >= 40) return 'text-amber-400';
  return 'text-red-400';
}

function ProgressRing({
  percent,
  className = '',
}: {
  percent: number;
  className?: string;
}) {
  const radius = (RING_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const colorClass = progressColor(percent);

  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className={`-rotate-90 shrink-0 ${className}`}
      aria-hidden
    >
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        className="text-white/10"
      />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={`transition-[stroke-dashoffset] duration-500 ease-out ${colorClass}`}
      />
    </svg>
  );
}

export function ProfileCompletionTracker({
  checks,
  onViewChecklist,
  fullWidthOnLarge = false,
}: ProfileCompletionTrackerProps) {
  const total = checks.length;
  const completed = checks.filter(item => item.done).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = percent >= 100;
  const remaining = total - completed;
  const colorClass = progressColor(percent);

  return (
    <div className={fullWidthOnLarge ? 'px-4 lg:px-0' : 'px-4 sm:px-6 lg:px-8'}>
      <div className="border-b border-white/[0.06] py-4">
        <button
          type="button"
          onClick={onViewChecklist}
          className="group flex w-full cursor-pointer items-center gap-3 text-left transition-opacity hover:opacity-90"
          aria-label={`Profile completion ${percent} percent. View checklist.`}
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
            {isComplete ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                <CheckIcon
                  className="h-4 w-4 text-emerald-400"
                  strokeWidth={2.5}
                />
              </span>
            ) : (
              <ProgressRing percent={percent} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <p className="text-sm font-medium text-zinc-200">
                Profile completion
              </p>
              <span
                className={`text-xs font-semibold tabular-nums ${colorClass}`}
              >
                {percent}%
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
              {isComplete
                ? 'All set — your profile is complete'
                : `${remaining} item${remaining === 1 ? '' : 's'} left to finish`}
            </p>
          </div>

          <ChevronRightIcon
            className="h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400"
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
}
