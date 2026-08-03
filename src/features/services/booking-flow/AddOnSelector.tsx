'use client';

import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useCallback, useState } from 'react';
import type { ServiceAddOn } from './types';

export interface AddOnSelectorLabels {
  seeDescription: string;
  hideDescription: string;
}

const DEFAULT_LABELS: AddOnSelectorLabels = {
  seeDescription: 'See description',
  hideDescription: 'Hide description',
};

interface AddOnSelectorProps {
  addOns: ServiceAddOn[];
  selectedIds: Set<string>;

  onToggle: (id: string) => void;
  /** Localized copy for the description toggle; defaults to English. */
  labels?: AddOnSelectorLabels;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export function AddOnSelector({
  addOns,
  selectedIds,
  onToggle,
  labels = DEFAULT_LABELS,
}: AddOnSelectorProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set<string>()
  );

  const toggleDescription = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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
        const description = addOn.description?.trim() || null;
        const isExpanded = expandedIds.has(addOn.id);
        const descriptionId = `addon-description-${addOn.id}`;
        // Duration and the description toggle share one row under the name.
        const hasMetaRow = extra != null || description != null;

        return (
          <div
            key={addOn.id}
            className={`rounded-xl border transition-colors ${
              isSelected
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]'
            }`}
          >
            <button
              type="button"
              onClick={() => onToggle(addOn.id)}
              className={`w-full flex items-center justify-between gap-3 px-4 pt-4 text-left cursor-pointer touch-manipulation ${
                hasMetaRow ? 'pb-1.5' : 'pb-4 min-h-[52px]'
              }`}
              aria-pressed={isSelected}
              aria-label={`${addOn.name}, ${formatPrice(addOn.priceCents)}${extra ? `, + ${extra}` : ''}. ${isSelected ? 'Selected' : 'Not selected'}`}
            >
              <span className="min-w-0 font-medium [overflow-wrap:anywhere]">
                {addOn.name}
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

            {hasMetaRow ? (
              <div className="px-4 pb-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  {extra ? (
                    <span className="text-zinc-500">+ {extra}</span>
                  ) : null}
                  {extra && description ? (
                    <span className="text-zinc-600" aria-hidden>
                      •
                    </span>
                  ) : null}
                  {description ? (
                    <button
                      type="button"
                      onClick={() => toggleDescription(addOn.id)}
                      className="font-medium text-zinc-400 underline underline-offset-2 hover:text-white transition-colors cursor-pointer touch-manipulation"
                      aria-expanded={isExpanded}
                      aria-controls={descriptionId}
                    >
                      {isExpanded
                        ? labels.hideDescription
                        : labels.seeDescription}
                    </button>
                  ) : null}
                </div>
                {description && isExpanded ? (
                  <p
                    id={descriptionId}
                    className="mt-2 text-xs leading-relaxed text-zinc-400 whitespace-pre-line [overflow-wrap:anywhere]"
                  >
                    {description}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
