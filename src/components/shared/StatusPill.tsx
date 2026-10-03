import React from 'react';

/** Color of a status pill. Shape stays the same everywhere. */
export type StatusPillTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

const TONE_CLASS: Record<StatusPillTone, string> = {
  neutral: 'border-white/15 bg-white/10 text-zinc-300',
  info: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
  warning: 'border-amber-500/35 bg-amber-500/12 text-amber-300',
  danger: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
};

export function StatusPill({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: React.ReactNode;
  tone?: StatusPillTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${TONE_CLASS[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
