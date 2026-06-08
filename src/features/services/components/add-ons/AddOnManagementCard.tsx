'use client';

import { GlassCard } from '@/components/shared';
import {
  serviceListingNameClassName,
  serviceListingPriceClassName,
} from '@/components/shared/serviceListingTypography';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
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
        {/* Name + price row, with optional extra duration under the name */}
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <h3 className={`${serviceListingNameClassName} min-w-0`}>
              {addOn.name}
            </h3>
            {durationLabel ? (
              <p className="mt-0.5 text-[10px] font-medium tracking-wide text-zinc-500">
                +{durationLabel}
              </p>
            ) : null}
          </div>
          <span className={`${serviceListingPriceClassName} flex-shrink-0`}>
            {formatPrice(addOn.price_cents)}
          </span>
        </div>

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
