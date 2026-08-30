'use client';

import { formatPaymentCents } from '@/features/payments/utils/formatPaymentMoney';
import React from 'react';
import type { RevenueSourceTotal } from '../revenue/summarizeRevenue';
import { paymentsSourceColor } from '../utils/paymentsSourceColors';

export function PaymentsRevenueSources({
  sources,
  totalCents,
}: {
  sources: RevenueSourceTotal[];
  totalCents: number;
}) {
  if (sources.length === 0) return null;
  const positiveTotal = sources.reduce(
    (sum, source) => sum + Math.max(source.cents, 0),
    0
  );
  const barTotal = positiveTotal > 0 ? positiveTotal : Math.abs(totalCents);

  return (
    <div className="mt-6">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
        Where it came from
      </p>
      {barTotal > 0 ? (
        <div
          className="mb-3 flex h-2 overflow-hidden rounded-full bg-white/[0.06]"
          aria-hidden
        >
          {sources
            .filter(source => source.cents > 0)
            .map(source => (
              <div
                key={source.source}
                className="h-full min-w-[2px]"
                style={{
                  width: `${Math.max((source.cents / barTotal) * 100, 0)}%`,
                  backgroundColor: paymentsSourceColor(source.source),
                }}
              />
            ))}
        </div>
      ) : null}
      <ul className="space-y-2">
        {sources.map(source => {
          const share =
            barTotal > 0 && source.cents > 0
              ? Math.round((source.cents / barTotal) * 100)
              : null;
          return (
            <li
              key={source.source}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2 text-zinc-300">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: paymentsSourceColor(source.source),
                  }}
                  aria-hidden
                />
                <span className="truncate">{source.label}</span>
                {share != null ? (
                  <span className="tabular-nums text-zinc-500">{share}%</span>
                ) : null}
              </span>
              <span className="shrink-0 font-medium tabular-nums text-white">
                {formatPaymentCents(source.cents)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
