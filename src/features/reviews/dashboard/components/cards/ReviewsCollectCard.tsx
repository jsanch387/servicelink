'use client';

import { DashboardGlassCard } from '@/features/dashboard';
import {
  ChevronDownIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import React, { useId, useState } from 'react';

export const ReviewsCollectCard: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  return (
    <DashboardGlassCard fillGridCell={false} padding="none" className="w-full">
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white/[0.02]"
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.04] ring-1 ring-inset ring-white/[0.08]">
          <QuestionMarkCircleIcon
            className="h-3.5 w-3.5 text-zinc-400"
            aria-hidden
          />
        </span>
        <span className="min-w-0 flex-1 text-xs font-semibold text-white sm:text-sm">
          How reviews work
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div
          id={panelId}
          className="border-t border-white/[0.06] px-3 pb-2.5 pt-1.5"
        >
          <p className="text-xs leading-snug text-zinc-500 sm:text-sm">
            Mark a visit complete and we&apos;ll email your customer a link to
            leave a review.
          </p>
          <ul className="mt-1.5 space-y-0.5 text-xs leading-snug text-zinc-500 sm:text-sm">
            <li className="flex gap-1.5">
              <span className="text-zinc-600" aria-hidden>
                ·
              </span>
              <span>Customer email required — text message coming soon</span>
            </li>
            <li className="flex gap-1.5">
              <span className="text-zinc-600" aria-hidden>
                ·
              </span>
              <span>One review per customer on your profile</span>
            </li>
            <li className="flex gap-1.5">
              <span className="text-zinc-600" aria-hidden>
                ·
              </span>
              <span>Shows on your public profile</span>
            </li>
          </ul>
        </div>
      ) : null}
    </DashboardGlassCard>
  );
};
