import { CheckIcon } from '@heroicons/react/24/solid';
import React from 'react';

export function MockStatusBar() {
  return (
    <div
      className="flex items-center justify-between px-5 pb-1 pt-8 text-[10px] font-semibold tabular-nums text-white"
      aria-hidden
    >
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <span className="flex h-2 items-end gap-px">
          <span className="h-1 w-[3px] rounded-sm bg-white/80" />
          <span className="h-1.5 w-[3px] rounded-sm bg-white/80" />
          <span className="h-2 w-[3px] rounded-sm bg-white" />
        </span>
        <span className="h-[8px] w-[18px] rounded-[3px] border border-white/80">
          <span className="ml-[1px] mt-[1px] block h-[4px] w-[12px] rounded-[1px] bg-white" />
        </span>
      </span>
    </div>
  );
}

export function MockStepTracker({
  current,
  labels = ['Service', 'Time', 'Details', 'Confirm'],
}: {
  current: number;
  labels?: readonly string[];
}) {
  return (
    <div className="mb-4" aria-hidden>
      <ol className="flex items-center gap-1.5">
        {labels.map((_, index) => (
          <li
            key={labels[index]}
            className={`h-1 flex-1 rounded-full ${
              index <= current ? 'bg-white' : 'bg-white/10'
            }`}
          />
        ))}
      </ol>
      <div className="mt-2 flex items-center justify-between">
        {labels.map((label, index) => (
          <span
            key={label}
            className={`text-[9px] font-semibold uppercase tracking-wide ${
              index === current
                ? 'text-white'
                : index < current
                  ? 'text-zinc-400'
                  : 'text-zinc-600'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MockCheck({ selected }: { selected: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
        selected
          ? 'border-white/40 bg-white/20'
          : 'border-white/20 bg-transparent'
      }`}
    >
      {selected ? <CheckIcon className="h-3.5 w-3.5 text-white" /> : null}
    </span>
  );
}

export function MockRow({
  selected,
  children,
}: {
  selected?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex min-h-[52px] items-center justify-between gap-3 rounded-xl border p-3.5 ${
        selected
          ? 'border-white/30 bg-white/10 text-white'
          : 'border-white/10 bg-white/[0.04] text-zinc-300'
      }`}
    >
      {children}
    </div>
  );
}

export function MockPrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white py-3 text-center text-[13px] font-semibold text-neutral-950">
      {children}
    </div>
  );
}

export function MockStatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-zinc-300">
      {children}
    </span>
  );
}
