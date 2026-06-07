'use client';

import {
  Button,
  CrownIcon,
  GlassCard,
  Input,
  PriceInput,
  Switch,
  TimeSelect,
} from '@/components/shared';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import type {
  ServicePriceOptionRow,
  ServiceRow,
} from '@/features/services/types/services';
import { parseServiceEditDurationForSave } from '@/features/services/utils/serviceEditForm';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';

type PriceOptionDraft = {
  id: string;
  label: string;
  price: string;
  durationHHmm: string;
};
export type ServicePriceOptionDraft = PriceOptionDraft;

function newOptionId(): string {
  return `opt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyOption(): PriceOptionDraft {
  return {
    id: newOptionId(),
    label: '',
    price: '',
    durationHHmm: '01:00',
  };
}

export interface ServicePriceOptionsSectionProps {
  service: ServiceRow;
  initialEnabled?: boolean;
  initialOptions?: ServicePriceOptionRow[];
  onChange?: (enabled: boolean, options: ServicePriceOptionDraft[]) => void;
  showValidationErrors?: boolean;
  submitErrorMessage?: string | null;
  isLocked?: boolean;
  upgradeHref?: string;
}

/**
 * Multiple price options per service (local state until wired to persistence).
 */
export function ServicePriceOptionsSection({
  service,
  initialEnabled = false,
  initialOptions = [],
  onChange,
  showValidationErrors = false,
  submitErrorMessage = null,
  isLocked = false,
  upgradeHref,
}: ServicePriceOptionsSectionProps) {
  const mappedInitialOptions = useMemo<PriceOptionDraft[]>(
    () =>
      initialOptions.map(o => ({
        id: o.id,
        label: o.label ?? '',
        // UI-only read for now; mirrors service card formatting.
        price:
          o.price_cents != null && o.price_cents > 0
            ? String(Math.round(o.price_cents / 100))
            : '',
        durationHHmm: minutesToHHmm(o.duration_minutes),
      })),
    [initialOptions]
  );

  const [enabled, setEnabled] = useState(initialEnabled);
  const [options, setOptions] = useState<PriceOptionDraft[]>(
    mappedInitialOptions.length > 0 ? mappedInitialOptions : [emptyOption()]
  );
  const [expandedOptionIds, setExpandedOptionIds] = useState<Set<string>>(
    () => new Set()
  );
  const [isSectionExpanded, setIsSectionExpanded] = useState(false);
  const teaserOptions = useMemo<PriceOptionDraft[]>(
    () => [
      {
        id: 'teaser-suv',
        label: 'SUV detail',
        price: '145',
        durationHHmm: '02:00',
      },
      {
        id: 'teaser-truck',
        label: 'Truck detail',
        price: '185',
        durationHHmm: '02:30',
      },
    ],
    []
  );
  const lockedHasSavedOptions = isLocked && mappedInitialOptions.length > 0;
  const displayedEnabled = isLocked ? true : enabled;
  const displayedOptions = isLocked
    ? lockedHasSavedOptions
      ? mappedInitialOptions
      : teaserOptions
    : options;

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  useEffect(() => {
    setOptions(
      mappedInitialOptions.length > 0 ? mappedInitialOptions : [emptyOption()]
    );
  }, [mappedInitialOptions, service.id]);

  useEffect(() => {
    // Existing DB-loaded options start collapsed for cleaner layout.
    setExpandedOptionIds(new Set());
  }, [service.id]);

  useEffect(() => {
    // Default the section to collapsed on first load per UX preference.
    setIsSectionExpanded(false);
  }, [service.id]);

  const handleEnable = useCallback(
    (on: boolean) => {
      if (isLocked) return;
      setEnabled(on);
    },
    [isLocked]
  );

  const updateOption = useCallback(
    (id: string, patch: Partial<PriceOptionDraft>) => {
      if (isLocked) return;
      setOptions(prev => prev.map(o => (o.id === id ? { ...o, ...patch } : o)));
    },
    [isLocked]
  );

  const removeOption = useCallback(
    (id: string) => {
      if (isLocked) return;
      setOptions(prev => {
        if (prev.length <= 1) return prev;
        return prev.filter(o => o.id !== id);
      });
      setExpandedOptionIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [isLocked]
  );

  const addOption = useCallback(() => {
    if (isLocked) return;
    const next = emptyOption();
    setOptions(prev => [...prev, next]);
    setExpandedOptionIds(prev => {
      const nextSet = new Set(prev);
      nextSet.add(next.id);
      return nextSet;
    });
  }, [isLocked]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedOptionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!showValidationErrors) return;
    setExpandedOptionIds(prev => {
      const next = new Set(prev);
      for (const opt of options) {
        const missingName = !opt.label.trim();
        const missingPrice =
          !opt.price.trim() || Number.isNaN(parseFloat(opt.price));
        const missingDuration = !parseServiceEditDurationForSave(
          opt.durationHHmm
        ).ok;
        if (missingName || missingPrice || missingDuration) next.add(opt.id);
      }
      return next;
    });
  }, [options, showValidationErrors]);

  useEffect(() => {
    if (isLocked) return;
    onChange?.(enabled, options);
  }, [enabled, isLocked, onChange, options]);

  return (
    <section className="mb-6 sm:mb-8" aria-labelledby="price-options-heading">
      <GlassCard
        blurColor="bg-zinc-500"
        rounded="rounded-2xl"
        padding="none"
        className="p-4 sm:p-6"
      >
        <button
          type="button"
          onClick={() => setIsSectionExpanded(prev => !prev)}
          className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
          aria-expanded={isSectionExpanded}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2
                id="price-options-heading"
                className="text-lg sm:text-base font-bold text-white tracking-tight"
              >
                Pricing options
              </h2>
              {isLocked ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold tracking-wide text-amber-300">
                  <CrownIcon className="h-3 w-3" />
                  Pro
                </span>
              ) : null}
            </div>
            {!isSectionExpanded ? (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                {displayedEnabled
                  ? `${displayedOptions.length} option${displayedOptions.length === 1 ? '' : 's'}`
                  : 'Off'}
              </p>
            ) : null}
          </div>
          {isSectionExpanded ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400 shrink-0" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400 shrink-0" />
          )}
        </button>

        {isSectionExpanded ? (
          <div className="mt-4 pt-4 border-t border-white/10 relative">
            {isLocked ? (
              <p className="text-sm text-gray-400 mb-3 leading-snug max-w-prose">
                {lockedHasSavedOptions
                  ? "Your options are saved, but customers won't see them until you upgrade to Pro."
                  : 'Upgrade to Pro to add different prices for this service.'}
              </p>
            ) : null}

            {!displayedEnabled ? (
              <p className="text-sm text-gray-400 mb-3 leading-snug max-w-prose">
                Same service, different prices? Turn this on and customers pick
                one when they book.
              </p>
            ) : null}

            <div
              className={`flex items-center justify-between gap-4 min-h-[52px] w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 active:bg-white/[0.06] ${
                isLocked ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              aria-disabled={isLocked}
            >
              <span className="text-sm font-medium text-white leading-snug pr-2">
                Offer multiple prices
              </span>
              <Switch
                size="md"
                checked={displayedEnabled}
                onCheckedChange={handleEnable}
                aria-label="Offer multiple prices for this service"
              />
            </div>

            {displayedEnabled ? (
              <div
                className={`mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-white/10 ${
                  isLocked ? 'opacity-70' : ''
                }`}
              >
                {submitErrorMessage ? (
                  <p className="text-sm text-red-400 mb-3">
                    {submitErrorMessage}
                  </p>
                ) : null}
                <p className="text-sm text-gray-400 mb-4 leading-snug">
                  Set the price in Service details to your cheapest option.
                  That&apos;s what shows as &quot;starting at&quot; on your
                  page.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={isLocked}
                  icon={<PlusIcon className="h-4 w-4 shrink-0 text-white" />}
                  className={`w-full sm:w-auto min-h-[48px] sm:min-h-0 justify-center mb-4 !border-white/30 !text-white !bg-transparent hover:!bg-white/10 hover:!border-white/45 hover:!text-white ${
                    isLocked ? 'cursor-not-allowed' : ''
                  }`}
                >
                  Add option
                </Button>

                {displayedOptions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center">
                    <p className="text-sm text-gray-400 leading-snug">
                      No options yet. Tap Add option above.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3 list-none p-0 m-0">
                    {displayedOptions.map((opt, index) => {
                      const isExpanded = isLocked
                        ? false
                        : expandedOptionIds.has(opt.id);
                      const label = opt.label.trim();
                      const durationValid = parseServiceEditDurationForSave(
                        opt.durationHHmm
                      ).ok;
                      const priceDisplay = opt.price.trim()
                        ? `$${opt.price.trim()}`
                        : null;
                      const durationDisplay = durationValid
                        ? formatDurationMinutes(hhmmToMinutes(opt.durationHHmm))
                        : null;
                      return (
                        <li key={opt.id} className="list-none">
                          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                            <div
                              className={`flex items-center justify-between gap-3 ${
                                isExpanded
                                  ? 'mb-4 pb-3 border-b border-white/10'
                                  : ''
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  !isLocked ? toggleExpanded(opt.id) : undefined
                                }
                                disabled={isLocked}
                                className={`flex-1 min-w-0 text-left rounded-lg px-1 py-1.5 transition-colors ${
                                  isLocked ? 'cursor-default' : 'cursor-pointer'
                                }`}
                                aria-expanded={isExpanded}
                                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} option ${index + 1}`}
                              >
                                <p className="text-sm font-medium text-gray-200 truncate">
                                  {label || `Option ${index + 1}`}
                                </p>
                                {!isExpanded ? (
                                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                                    {[priceDisplay, durationDisplay]
                                      .filter(Boolean)
                                      .join(' · ') || 'Tap to add details'}
                                  </p>
                                ) : null}
                              </button>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => removeOption(opt.id)}
                                  disabled={
                                    isLocked || displayedOptions.length <= 1
                                  }
                                  className={`inline-flex items-center gap-1.5 text-sm font-medium px-2 py-2 text-rose-400/90 hover:text-rose-300 disabled:opacity-30 disabled:pointer-events-none min-h-[44px] rounded-lg transition-colors sm:min-h-0 ${
                                    isLocked
                                      ? 'cursor-not-allowed'
                                      : 'cursor-pointer'
                                  }`}
                                  aria-label="Remove this option"
                                >
                                  <TrashIcon className="h-4 w-4 shrink-0" />
                                  <span className="hidden sm:inline">
                                    Remove
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    !isLocked
                                      ? toggleExpanded(opt.id)
                                      : undefined
                                  }
                                  disabled={isLocked}
                                  className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-gray-300 hover:text-white transition-colors sm:min-h-0 sm:min-w-0 sm:p-2 ${
                                    isLocked
                                      ? 'cursor-not-allowed'
                                      : 'cursor-pointer'
                                  }`}
                                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} option ${index + 1}`}
                                >
                                  {isExpanded ? (
                                    <ChevronUpIcon className="h-4 w-4" />
                                  ) : (
                                    <ChevronDownIcon className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div
                              className={`grid transition-all duration-200 ease-out ${
                                isExpanded
                                  ? 'grid-rows-[1fr] opacity-100'
                                  : 'grid-rows-[0fr] opacity-0'
                              }`}
                            >
                              <div className="overflow-hidden">
                                <div className="flex flex-col gap-4">
                                  <div>
                                    <span className="block text-sm font-medium text-gray-300 mb-2">
                                      Name
                                    </span>
                                    <Input
                                      placeholder="e.g. Sedan, crew cab truck"
                                      value={opt.label}
                                      onChange={v =>
                                        updateOption(opt.id, { label: v })
                                      }
                                      error={
                                        showValidationErrors &&
                                        !opt.label.trim()
                                          ? 'Name is required.'
                                          : undefined
                                      }
                                    />
                                  </div>
                                  <div>
                                    <span className="block text-sm font-medium text-gray-300 mb-2">
                                      Price
                                    </span>
                                    <PriceInput
                                      placeholder="0"
                                      value={opt.price}
                                      onChange={v =>
                                        updateOption(opt.id, { price: v })
                                      }
                                      error={
                                        showValidationErrors &&
                                        (!opt.price.trim() ||
                                          Number.isNaN(parseFloat(opt.price)))
                                          ? 'Price is required.'
                                          : undefined
                                      }
                                    />
                                  </div>
                                  <div>
                                    <span className="block text-sm font-medium text-gray-300 mb-2">
                                      How long
                                    </span>
                                    <TimeSelect
                                      variant="duration"
                                      value={opt.durationHHmm}
                                      onChange={v =>
                                        updateOption(opt.id, {
                                          durationHHmm: v,
                                        })
                                      }
                                      durationPlaceholder="Select duration"
                                    />
                                    {showValidationErrors &&
                                    !parseServiceEditDurationForSave(
                                      opt.durationHHmm
                                    ).ok ? (
                                      <p className="mt-1.5 text-sm text-red-400">
                                        Duration is required.
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : (
              <div className={`mt-4 ${isLocked ? 'opacity-70' : ''}`}>
                <GlassCard
                  blurColor="bg-zinc-500"
                  rounded="rounded-2xl"
                  padding="md"
                  className="!border-dashed border-white/20 !bg-white/[0.02] py-6 sm:py-7 text-center"
                >
                  <p className="text-sm text-gray-400 leading-snug">
                    One price — whatever you set in Service details above.
                  </p>
                </GlassCard>
              </div>
            )}
            {isLocked && upgradeHref ? (
              <Button
                href={upgradeHref}
                variant="inverse"
                icon={<CrownIcon className="h-4 w-4" />}
                className="w-full mt-4"
              >
                Upgrade to Pro
              </Button>
            ) : null}
          </div>
        ) : null}
      </GlassCard>
    </section>
  );
}

function minutesToHHmm(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes));
  const h = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const m = (safe % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function hhmmToMinutes(hhmm: string): number {
  const [h = '0', m = '0'] = hhmm.split(':');
  const hours = Number.parseInt(h, 10);
  const mins = Number.parseInt(m, 10);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return 0;
  return Math.max(0, hours * 60 + mins);
}
