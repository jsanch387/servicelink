'use client';

import { DashboardGlassCard } from '@/features/dashboard';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import React from 'react';

export const ReviewsCollectCard: React.FC = () => {
  return (
    <DashboardGlassCard fillGridCell={false} padding="md" className="w-full">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.08]">
          <EnvelopeIcon className="h-5 w-5 text-zinc-400" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">How reviews work</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            Mark a visit complete and we&apos;ll email your customer a link to
            leave a review.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-zinc-500">
            <li className="flex gap-2">
              <span className="text-zinc-600" aria-hidden>
                ·
              </span>
              <span>Customer email required — text message coming soon</span>
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-600" aria-hidden>
                ·
              </span>
              <span>One review per visit</span>
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-600" aria-hidden>
                ·
              </span>
              <span>Shows on your public profile</span>
            </li>
          </ul>
        </div>
      </div>
    </DashboardGlassCard>
  );
};
