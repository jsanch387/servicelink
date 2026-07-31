'use client';

import { GlassCard } from '@/components/shared';
import React, { useMemo } from 'react';
import type { CreateAppointmentJobDraft } from '../types';
import { formatCatalogPriceCents } from '../utils/catalogServiceHelpers';

export interface SelectionSummaryCardProps {
  draft: CreateAppointmentJobDraft;
}

export function SelectionSummaryCard({ draft }: SelectionSummaryCardProps) {
  const addOnTotal = useMemo(
    () => draft.selectedAddOns.reduce((s, a) => s + a.priceCents, 0),
    [draft.selectedAddOns]
  );
  const totalCents = draft.servicePriceCents + addOnTotal;

  const hasJob = Boolean(draft.serviceName.trim()) || draft.isCustomJob;
  if (!hasJob) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-zinc-200">Summary</p>
      <GlassCard
        padding="md"
        rounded="rounded-2xl"
        blurColor="bg-zinc-500"
        showBlur
        className="w-full"
      >
        <div className="space-y-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white [overflow-wrap:anywhere]">
                {draft.serviceName || 'Custom job'}
              </p>
              {draft.pricingOption?.label ? (
                <p className="mt-0.5 text-xs text-zinc-500">
                  {draft.pricingOption.label}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 tabular-nums text-zinc-300">
              {formatCatalogPriceCents(draft.servicePriceCents)}
            </p>
          </div>

          {draft.selectedAddOns.length > 0 ? (
            <ul className="space-y-1.5 text-zinc-400">
              {draft.selectedAddOns.map(a => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3"
                >
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    {a.name}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatCatalogPriceCents(a.priceCents)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="h-px w-full bg-white/10" aria-hidden />

          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-white">Total</span>
            <span className="tabular-nums font-semibold text-white">
              {formatCatalogPriceCents(totalCents)}
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
