'use client';

import { Card } from '@/components/shared/Card';
import React from 'react';

const pulse = 'animate-pulse rounded-lg bg-white/10';

const SKELETON_CARD_COUNT = 6;

function MarketplaceResultCardSkeleton() {
  return (
    <Card
      className="flex h-full flex-col overflow-hidden !rounded-2xl !border-white/[0.09] !bg-neutral-900 !p-0"
      padding="sm"
      aria-hidden
    >
      <div className="relative grid h-36 grid-cols-3 gap-0.5 overflow-hidden bg-neutral-950 sm:h-40">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="animate-pulse bg-white/[0.06]" />
        ))}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
        <div className="flex items-start gap-3">
          <div className={`h-11 w-11 shrink-0 !rounded-xl ${pulse}`} />
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <div className={`h-4 w-[70%] max-w-[11rem] ${pulse}`} />
            <div className={`h-3 w-[45%] max-w-[8rem] ${pulse}`} />
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-white/[0.08] pt-3.5">
          <div className={`h-3 w-20 ${pulse}`} />
          <div className="flex items-center justify-between gap-3">
            <div className={`h-4 w-16 ${pulse}`} />
            <div className={`h-4 w-12 ${pulse}`} />
          </div>
        </div>
      </div>
    </Card>
  );
}

/** Grid of result-card placeholders shown while marketplace search is in flight. */
export function MarketplaceResultsSkeleton({
  count = SKELETON_CARD_COUNT,
}: {
  count?: number;
}) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-live="polite"
      aria-label="Loading detailers"
    >
      {Array.from({ length: count }, (_, index) => (
        <MarketplaceResultCardSkeleton key={index} />
      ))}
      <span className="sr-only">Loading detailers…</span>
    </div>
  );
}
