'use client';

import { GlassCard } from '@/components/shared';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import {
  ClockIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import type { AddOnRow } from './addOnTypes';

function formatPrice(priceCents: number | null): string {
  if (priceCents == null) return 'Contact for quote';
  if (priceCents === 0) return 'Contact for quote';
  return `$${(priceCents / 100).toFixed(0)}`;
}

export interface AddOnManagementCardProps {
  addOn: AddOnRow;
  onEdit: (addOn: AddOnRow) => void;
  onDelete: (addOnId: string) => void;
}

export const AddOnManagementCard: React.FC<AddOnManagementCardProps> = ({
  addOn,
  onEdit,
  onDelete,
}) => {
  const durationLabel =
    addOn.duration_minutes != null && addOn.duration_minutes > 0
      ? formatDurationMinutes(addOn.duration_minutes)
      : null;

  return (
    <GlassCard
      blurColor="bg-zinc-500"
      rounded="rounded-2xl"
      padding="md"
      className="w-full min-w-0 transition-all duration-200 group"
    >
      {/* Mobile: compact single-column. Desktop: same, actions inline */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Name + price — same row on all sizes, name truncates */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex-1 min-w-0 truncate">
            {addOn.name}
          </h3>
          <span className="text-lg sm:text-xl font-black text-white leading-none flex-shrink-0 tabular-nums">
            {formatPrice(addOn.price_cents)}
          </span>
        </div>

        {durationLabel ? (
          <div className="flex items-center gap-1.5 text-zinc-500">
            <ClockIcon className="h-3 w-3 flex-shrink-0" />
            <span className="text-[10px] font-medium tracking-wide">
              +{durationLabel}
            </span>
          </div>
        ) : null}

        {/* Actions — outlined style (matches ServiceManagementCard) */}
        <div className="flex items-stretch gap-2 pt-4 sm:pt-5">
          <button
            type="button"
            onClick={() => onEdit(addOn)}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm font-medium rounded-xl border border-white/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all active:scale-95 cursor-pointer touch-manipulation"
            aria-label="Edit add-on"
          >
            <PencilSquareIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-emerald-500 flex-shrink-0" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(addOn.id)}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm font-medium rounded-xl border border-white/20 hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-400 transition-all active:scale-95 cursor-pointer touch-manipulation"
            aria-label="Delete add-on"
          >
            <TrashIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-red-500 flex-shrink-0" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>
    </GlassCard>
  );
};
