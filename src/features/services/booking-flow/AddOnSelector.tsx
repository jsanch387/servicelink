'use client';

import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { CheckIcon } from '@heroicons/react/24/solid';
import type { ServiceAddOn } from './types';

interface AddOnSelectorProps {
  addOns: ServiceAddOn[];
  selectedIds: Set<string>;

  onToggle: (id: string) => void;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export function AddOnSelector({
  addOns,
  selectedIds,
  onToggle,
}: AddOnSelectorProps) {
  if (addOns.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No add-ons available for this service.
      </p>
    );
  }

  return (
    <div className="space-y-2" role="group" aria-label="Optional add-ons">
      {addOns.map(addOn => {
        const isSelected = selectedIds.has(addOn.id);
        const extra =
          addOn.durationMinutes != null && addOn.durationMinutes > 0
            ? formatDurationMinutes(addOn.durationMinutes)
            : null;
        return (
          <button
            key={addOn.id}
            type="button"
            onClick={() => onToggle(addOn.id)}
            className={`w-full flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors cursor-pointer touch-manipulation min-h-[52px] ${
              isSelected
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]'
            }`}
            aria-pressed={isSelected}
            aria-label={`${addOn.name}, ${formatPrice(addOn.priceCents)}${extra ? `, + ${extra}` : ''}. ${isSelected ? 'Selected' : 'Not selected'}`}
          >
            <span className="min-w-0 font-medium">
              <span className="block [overflow-wrap:anywhere]">
                {addOn.name}
              </span>
              {extra ? (
                <span className="block text-xs font-normal text-zinc-500 mt-0.5">
                  + {extra}
                </span>
              ) : null}
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-zinc-400">
                +{formatPrice(addOn.priceCents)}
              </span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
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
