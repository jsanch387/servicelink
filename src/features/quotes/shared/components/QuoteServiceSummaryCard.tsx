'use client';

import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import React from 'react';
import {
  splitQuoteServiceDisplayName,
  type QuoteAddonDetail,
} from '../quoteServiceSnapshot';

function formatPriceCents(cents: number): string {
  if (cents <= 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export type QuoteServiceSummaryCardProps = {
  serviceName: string;
  /** When set, preferred over parsing `serviceName`. */
  optionLabel?: string | null;
  durationMinutes: number;
  totalCents: number;
  addOns?: QuoteAddonDetail[] | null;
  className?: string;
};

/**
 * Service + option + add-ons layout used on owner review and public `/q/[token]`.
 */
export function QuoteServiceSummaryCard({
  serviceName,
  optionLabel: optionLabelProp,
  durationMinutes,
  totalCents,
  addOns,
  className = '',
}: QuoteServiceSummaryCardProps) {
  const parsed = splitQuoteServiceDisplayName(serviceName);
  const title = parsed.title;
  const optionLabel = (optionLabelProp ?? parsed.optionLabel)?.trim() || null;
  const list = addOns?.filter(a => a.name.trim()) ?? [];

  return (
    <div
      className={`overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          {optionLabel ? (
            <p className="mt-0.5 text-xs text-zinc-400">{optionLabel}</p>
          ) : null}
          <p className="mt-1 text-xs text-zinc-500">
            {formatDurationMinutes(durationMinutes)}
          </p>
        </div>
        <p className="shrink-0 text-base font-bold tabular-nums text-white">
          {formatPriceCents(totalCents)}
        </p>
      </div>

      {list.length > 0 ? (
        <div className="border-t border-white/10 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Add-ons
          </p>
          <ul className="space-y-2">
            {list.map(addOn => (
              <li
                key={addOn.id || addOn.name}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0 text-zinc-300">{addOn.name}</span>
                <span className="shrink-0 tabular-nums text-zinc-400">
                  +{formatPriceCents(addOn.priceCents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
