'use client';

import {
  GlassCard,
  Input,
  PriceInput,
  TextArea,
  TimeSelect,
} from '@/components/shared';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { minutesToServiceDurationHHmm } from '@/features/availability/utils/timeOptions';
import { PublicServiceCategoryFilters } from '@/features/business-profile/components/PublicServiceCategoryFilters';
import {
  AddOnSelector,
  PriceOptionSelector,
} from '@/features/services/booking-flow';
import type { ServiceCategoryRow } from '@/features/services/categories/types/serviceCategories';
import { SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID } from '@/features/services/categories/types/serviceCategories';
import {
  buildPublicServiceCategoryOptions,
  shouldShowPublicServiceCategoryFilters,
} from '@/features/services/categories/utils/buildPublicServiceCategoryOptions';
import {
  SERVICE_EDIT_DURATION_ERROR,
  parseServiceEditDurationForSave,
} from '@/features/services/utils/serviceEditForm';
import React, { useEffect, useMemo, useState } from 'react';
import type { QuoteCatalogService } from '../server/loadQuoteServiceCatalog';

export type QuoteServiceMode = 'catalog' | 'custom' | null;

/** One-screen-at-a-time substeps when picking from the catalog. */
export type QuoteCatalogPhase = 'list' | 'option' | 'addons' | 'ready';

export type QuoteCatalogSelection = {
  serviceId: string | null;
  priceOptionId: string | null;
  addOnIds: string[];
};

type QuoteServiceStepProps = {
  catalog: QuoteCatalogService[];
  serviceCategories?: ServiceCategoryRow[];
  mode: QuoteServiceMode;
  onModeChange: (mode: QuoteServiceMode) => void;
  catalogPhase: QuoteCatalogPhase;
  onCatalogPhaseChange: (phase: QuoteCatalogPhase) => void;
  selection: QuoteCatalogSelection;
  onSelectionChange: (next: QuoteCatalogSelection) => void;
  serviceName: string;
  onServiceNameChange: (v: string) => void;
  priceDigits: string;
  onPriceDigitsChange: (v: string) => void;
  durationHHmm: string;
  onDurationHHmmChange: (v: string) => void;
  note: string;
  onNoteChange: (v: string) => void;
  onCatalogDerivedChange: (derived: {
    serviceName: string;
    priceDigits: string;
    durationHHmm: string;
    servicePriceCents: number;
    addonDetails: {
      id: string;
      name: string;
      priceCents: number;
      durationMinutes?: number | null;
    }[];
  }) => void;
};

function formatPriceCents(cents: number): string {
  if (cents <= 0) return 'Contact';
  return `$${(cents / 100).toFixed(0)}`;
}

function buildCatalogDerived(
  service: QuoteCatalogService,
  priceOptionId: string | null,
  addOnIds: string[]
): {
  serviceName: string;
  priceDigits: string;
  durationHHmm: string;
  servicePriceCents: number;
  addonDetails: {
    id: string;
    name: string;
    priceCents: number;
    durationMinutes?: number | null;
  }[];
} {
  const option =
    priceOptionId != null
      ? (service.priceOptions.find(o => o.id === priceOptionId) ?? null)
      : null;
  const selectedAddOns = service.addOns.filter(a => addOnIds.includes(a.id));

  const basePrice = option?.priceCents ?? service.priceCents;
  const baseDuration = option?.durationMinutes ?? service.durationMinutes;
  const addOnPrice = selectedAddOns.reduce((sum, a) => sum + a.priceCents, 0);
  const addOnDuration = selectedAddOns.reduce(
    (sum, a) =>
      sum +
      (a.durationMinutes != null && a.durationMinutes > 0
        ? a.durationMinutes
        : 0),
    0
  );

  const serviceName = option
    ? `${service.name} — ${option.label}`
    : service.name;

  const totalMinutes = Math.max(1, baseDuration + addOnDuration);
  const totalCents = Math.max(0, basePrice + addOnPrice);

  return {
    serviceName,
    priceDigits: String(Math.round(totalCents / 100)),
    durationHHmm: minutesToServiceDurationHHmm(totalMinutes) || '01:00',
    servicePriceCents: basePrice,
    addonDetails: selectedAddOns.map(a => ({
      id: a.id,
      name: a.name,
      priceCents: a.priceCents,
      durationMinutes: a.durationMinutes ?? null,
    })),
  };
}

function nextPhaseAfterService(
  service: QuoteCatalogService
): QuoteCatalogPhase {
  if (service.priceOptionsEnabled && service.priceOptions.length > 0) {
    return 'option';
  }
  if (service.addOns.length > 0) return 'addons';
  return 'ready';
}

function nextPhaseAfterOption(service: QuoteCatalogService): QuoteCatalogPhase {
  if (service.addOns.length > 0) return 'addons';
  return 'ready';
}

export function isQuoteCatalogSelectionComplete(
  catalog: QuoteCatalogService[],
  selection: QuoteCatalogSelection
): boolean {
  if (!selection.serviceId) return false;
  const service = catalog.find(s => s.id === selection.serviceId);
  if (!service) return false;
  if (service.priceOptionsEnabled && service.priceOptions.length > 0) {
    return Boolean(
      selection.priceOptionId &&
        service.priceOptions.some(o => o.id === selection.priceOptionId)
    );
  }
  return true;
}

/** Sticky Continue is enabled once catalog sub-flow is past required picks. */
export function isQuoteCatalogPhaseReady(
  phase: QuoteCatalogPhase,
  catalog: QuoteCatalogService[],
  selection: QuoteCatalogSelection
): boolean {
  if (phase === 'addons' || phase === 'ready') {
    return isQuoteCatalogSelectionComplete(catalog, selection);
  }
  return false;
}

function filterCatalogByCategory(
  services: QuoteCatalogService[],
  activeFilterId: string
): QuoteCatalogService[] {
  if (activeFilterId === SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID) {
    return services.filter(service => service.categoryId == null);
  }
  return services.filter(service => service.categoryId === activeFilterId);
}

export const QuoteServiceStep: React.FC<QuoteServiceStepProps> = ({
  catalog,
  serviceCategories = [],
  mode,
  onModeChange,
  catalogPhase,
  onCatalogPhaseChange,
  selection,
  onSelectionChange,
  serviceName,
  onServiceNameChange,
  priceDigits,
  onPriceDigitsChange,
  durationHHmm,
  onDurationHHmmChange,
  note,
  onNoteChange,
  onCatalogDerivedChange,
}) => {
  const selectedService = useMemo(
    () =>
      selection.serviceId
        ? (catalog.find(s => s.id === selection.serviceId) ?? null)
        : null,
    [catalog, selection.serviceId]
  );

  const selectedAddOnIdSet = useMemo(
    () => new Set(selection.addOnIds),
    [selection.addOnIds]
  );

  const catalogForFilters = useMemo(
    () =>
      catalog.map(s => ({
        id: s.id,
        category_id: s.categoryId,
      })),
    [catalog]
  );

  const showCategoryFilters = shouldShowPublicServiceCategoryFilters(
    serviceCategories,
    catalogForFilters
  );

  const categoryOptions = useMemo(
    () =>
      showCategoryFilters
        ? buildPublicServiceCategoryOptions(
            serviceCategories,
            catalogForFilters,
            'Other'
          )
        : [],
    [showCategoryFilters, serviceCategories, catalogForFilters]
  );

  const [activeCategoryFilter, setActiveCategoryFilter] = useState('');

  useEffect(() => {
    if (categoryOptions.length === 0) {
      setActiveCategoryFilter('');
      return;
    }
    setActiveCategoryFilter(prev =>
      categoryOptions.some(option => option.id === prev)
        ? prev
        : categoryOptions[0].id
    );
  }, [categoryOptions]);

  const displayServices = useMemo(() => {
    if (!showCategoryFilters || !activeCategoryFilter) return catalog;
    return filterCatalogByCategory(catalog, activeCategoryFilter);
  }, [catalog, showCategoryFilters, activeCategoryFilter]);

  useEffect(() => {
    if (mode !== 'catalog' || !selectedService) return;
    if (
      selectedService.priceOptionsEnabled &&
      selectedService.priceOptions.length > 0 &&
      !selection.priceOptionId
    ) {
      return;
    }
    onCatalogDerivedChange(
      buildCatalogDerived(
        selectedService,
        selection.priceOptionId,
        selection.addOnIds
      )
    );
  }, [
    mode,
    selectedService,
    selection.priceOptionId,
    selection.addOnIds,
    onCatalogDerivedChange,
  ]);

  const hasCatalog = catalog.length > 0;

  const resetCatalog = () => {
    onSelectionChange({
      serviceId: null,
      priceOptionId: null,
      addOnIds: [],
    });
    onCatalogPhaseChange('list');
  };

  if (mode === null) {
    return (
      <div
        className="space-y-2"
        role="radiogroup"
        aria-label="How to set the service"
      >
        {hasCatalog ? (
          <button
            type="button"
            role="radio"
            aria-checked={false}
            onClick={() => {
              resetCatalog();
              onModeChange('catalog');
            }}
            className="flex w-full min-h-[52px] cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-white">
                From your services
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                Choose a service from your list.
              </span>
            </span>
            <span
              className="h-6 w-6 shrink-0 rounded-full border-2 border-white/20"
              aria-hidden
            />
          </button>
        ) : null}
        <button
          type="button"
          role="radio"
          aria-checked={false}
          onClick={() => onModeChange('custom')}
          className="flex w-full min-h-[52px] cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-white">
              Custom service
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
              For something that isn&apos;t on your list.
            </span>
          </span>
          <span
            className="h-6 w-6 shrink-0 rounded-full border-2 border-white/20"
            aria-hidden
          />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {mode === 'catalog' && catalogPhase === 'list' ? (
        <div className="space-y-4">
          {showCategoryFilters ? (
            <PublicServiceCategoryFilters
              options={categoryOptions}
              value={activeCategoryFilter}
              onChange={setActiveCategoryFilter}
              ariaLabel="Service categories"
              edgeGutter="bookFlow"
            />
          ) : null}

          {displayServices.length > 0 ? (
            <div
              className="space-y-2"
              role="listbox"
              aria-label="Your services"
            >
              {displayServices.map(service => {
                const durationLine = formatDurationMinutes(
                  service.durationMinutes
                );
                const showStartingAt =
                  service.priceOptionsEnabled && service.priceCents > 0;
                const extras: string[] = [];
                if (
                  service.priceOptionsEnabled &&
                  service.priceOptions.length > 0
                ) {
                  extras.push(
                    `${service.priceOptions.length} option${service.priceOptions.length === 1 ? '' : 's'}`
                  );
                }
                if (service.addOns.length > 0) {
                  extras.push(
                    `${service.addOns.length} add-on${service.addOns.length === 1 ? '' : 's'}`
                  );
                }
                return (
                  <button
                    key={service.id}
                    type="button"
                    role="option"
                    aria-selected={selection.serviceId === service.id}
                    onClick={() => {
                      onSelectionChange({
                        serviceId: service.id,
                        priceOptionId: null,
                        addOnIds: [],
                      });
                      onCatalogPhaseChange(nextPhaseAfterService(service));
                    }}
                    className="flex w-full min-h-[52px] cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-white">
                        {service.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {[
                          durationLine,
                          extras.length > 0 ? extras.join(' · ') : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-zinc-400">
                      {showStartingAt ? (
                        <span className="text-xs text-zinc-500">
                          from {formatPriceCents(service.priceCents)}
                        </span>
                      ) : (
                        formatPriceCents(service.priceCents)
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500">
              No services in this category.
            </p>
          )}
        </div>
      ) : null}

      {mode === 'catalog' && catalogPhase === 'option' && selectedService ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-white">
              {selectedService.name}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">Choose an option.</p>
          </div>
          <PriceOptionSelector
            options={selectedService.priceOptions}
            selectedId={selection.priceOptionId}
            onSelect={id => {
              onSelectionChange({
                ...selection,
                priceOptionId: id,
                addOnIds: [],
              });
              onCatalogPhaseChange(nextPhaseAfterOption(selectedService));
            }}
          />
        </div>
      ) : null}

      {mode === 'catalog' && catalogPhase === 'addons' && selectedService ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-white">
              {selectedService.name}
              {selection.priceOptionId
                ? ` — ${selectedService.priceOptions.find(o => o.id === selection.priceOptionId)?.label ?? ''}`
                : ''}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Optional. Tap any to include, then continue.
            </p>
          </div>
          <AddOnSelector
            addOns={selectedService.addOns}
            selectedIds={selectedAddOnIdSet}
            onToggle={id => {
              const next = new Set(selection.addOnIds);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              onSelectionChange({
                ...selection,
                addOnIds: Array.from(next),
              });
            }}
          />
        </div>
      ) : null}

      {mode === 'catalog' && catalogPhase === 'ready' && selectedService ? (
        <div className="space-y-4">
          {(() => {
            const option =
              selection.priceOptionId != null
                ? (selectedService.priceOptions.find(
                    o => o.id === selection.priceOptionId
                  ) ?? null)
                : null;
            const selectedAddOns = selectedService.addOns.filter(a =>
              selection.addOnIds.includes(a.id)
            );
            const basePrice = option?.priceCents ?? selectedService.priceCents;
            const baseDuration =
              option?.durationMinutes ?? selectedService.durationMinutes;
            const addOnDuration = selectedAddOns.reduce(
              (sum, a) =>
                sum +
                (a.durationMinutes != null && a.durationMinutes > 0
                  ? a.durationMinutes
                  : 0),
              0
            );
            const totalMinutes = Math.max(1, baseDuration + addOnDuration);
            const totalCents = Math.max(
              0,
              basePrice +
                selectedAddOns.reduce((sum, a) => sum + a.priceCents, 0)
            );

            return (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                <div className="flex items-start justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {selectedService.name}
                    </p>
                    {option ? (
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {option.label}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatDurationMinutes(totalMinutes)}
                    </p>
                  </div>
                  <p className="shrink-0 text-base font-bold tabular-nums text-white">
                    {formatPriceCents(totalCents)}
                  </p>
                </div>

                {selectedAddOns.length > 0 ? (
                  <div className="border-t border-white/10 px-4 py-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Add-ons
                    </p>
                    <ul className="space-y-2">
                      {selectedAddOns.map(addOn => (
                        <li
                          key={addOn.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="min-w-0 text-zinc-300">
                            {addOn.name}
                          </span>
                          <span className="shrink-0 tabular-nums text-zinc-400">
                            +{formatPriceCents(addOn.priceCents)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })()}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-200">
              Notes{' '}
              <span className="font-normal text-zinc-500">(optional)</span>
            </p>
            <TextArea
              placeholder="Add any notes here for your customer."
              value={note}
              onChange={onNoteChange}
              rows={3}
              maxLength={500}
              required={false}
            />
          </div>
        </div>
      ) : null}

      {mode === 'custom' ? (
        <>
          <GlassCard
            padding="md"
            rounded="rounded-2xl"
            blurColor="bg-zinc-500"
            showBlur={true}
            className="w-full"
          >
            <div className="space-y-5">
              <Input
                label="Service name"
                placeholder='e.g. "3 Muddy Razors — full restore"'
                value={serviceName}
                onChange={onServiceNameChange}
                required
              />
              <PriceInput
                label="Price"
                placeholder="e.g. $100"
                value={priceDigits}
                onChange={onPriceDigitsChange}
                required
              />
              <div className="min-w-0">
                <span className="mb-1.5 block text-left text-sm font-medium text-gray-200">
                  Duration
                  <span className="ml-1 text-red-400">*</span>
                </span>
                <TimeSelect
                  variant="duration"
                  value={durationHHmm}
                  onChange={onDurationHHmmChange}
                  durationPlaceholder="Select duration"
                />
                {durationHHmm.trim().length > 0 &&
                !parseServiceEditDurationForSave(durationHHmm).ok ? (
                  <p className="mt-1.5 text-sm text-red-400">
                    {SERVICE_EDIT_DURATION_ERROR}
                  </p>
                ) : null}
              </div>
            </div>
          </GlassCard>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-200">Notes</p>
            <TextArea
              placeholder="Add any notes here for your customer."
              value={note}
              onChange={onNoteChange}
              rows={3}
              maxLength={500}
              required={false}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};

export default QuoteServiceStep;
