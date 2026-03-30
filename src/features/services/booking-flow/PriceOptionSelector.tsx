'use client';

import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { CheckIcon } from '@heroicons/react/24/solid';
import type { PriceOptionForBooking } from '@/features/services/api/getServiceWithAddOnsForBooking';

interface PriceOptionSelectorProps {
  options: PriceOptionForBooking[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export function PriceOptionSelector({
  options,
  selectedId,
  onSelect,
}: PriceOptionSelectorProps) {
  if (options.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No price options are available for this service.
      </p>
    );
  }

  return (
    <div
      className="space-y-2"
      role="radiogroup"
      aria-label="Choose a price option"
    >
      {options.map(opt => {
        const isSelected = selectedId === opt.id;
        const durationLine = formatDurationMinutes(opt.durationMinutes);
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(opt.id)}
            className={`w-full flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors cursor-pointer touch-manipulation min-h-[52px] ${
              isSelected
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]'
            }`}
          >
            <span className="font-medium min-w-0">
              <span className="block">{opt.label}</span>
              <span className="block text-xs font-normal text-zinc-500 mt-0.5">
                {durationLine}
              </span>
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-zinc-400 tabular-nums">
                {formatPrice(opt.priceCents)}
              </span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  isSelected
                    ? 'border-white/40 bg-white/20'
                    : 'border-white/20 bg-transparent'
                }`}
                aria-hidden
              >
                {isSelected ? (
                  <CheckIcon className="h-3.5 w-3.5 text-white" />
                ) : null}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
