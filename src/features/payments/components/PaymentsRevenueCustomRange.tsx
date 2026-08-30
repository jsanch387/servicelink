'use client';

import React from 'react';

interface PaymentsRevenueCustomRangeProps {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
}

export function PaymentsRevenueCustomRange({
  from,
  to,
  onChange,
}: PaymentsRevenueCustomRangeProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          From
        </span>
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={event => onChange({ from: event.target.value, to })}
          className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus-visible:border-white/25 focus-visible:ring-2 focus-visible:ring-white/20 [color-scheme:dark]"
        />
      </label>
      <label className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          To
        </span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={event => onChange({ from, to: event.target.value })}
          className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus-visible:border-white/25 focus-visible:ring-2 focus-visible:ring-white/20 [color-scheme:dark]"
        />
      </label>
    </div>
  );
}
