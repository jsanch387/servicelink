'use client';

import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { PublicServiceCategoryFilters } from '@/features/business-profile/components/PublicServiceCategoryFilters';
import type { QuoteCatalogService } from '@/features/quotes/server/loadQuoteServiceCatalog';
import type { ServiceCategoryRow } from '@/features/services/categories/types/serviceCategories';
import { SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID } from '@/features/services/categories/types/serviceCategories';
import {
  buildPublicServiceCategoryOptions,
  shouldShowPublicServiceCategoryFilters,
} from '@/features/services/categories/utils/buildPublicServiceCategoryOptions';
import React, { useEffect, useMemo, useState } from 'react';
import {
  catalogServiceListPriceCents,
  formatCatalogPriceCents,
} from '../utils/catalogServiceHelpers';

export interface ServiceCatalogListStepProps {
  catalog: QuoteCatalogService[];
  serviceCategories: ServiceCategoryRow[];
  selectedServiceId: string | null;
  onSelect: (serviceId: string) => void;
}

function filterByCategory(
  services: QuoteCatalogService[],
  activeFilterId: string
): QuoteCatalogService[] {
  if (activeFilterId === SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID) {
    return services.filter(s => s.categoryId == null);
  }
  return services.filter(s => s.categoryId === activeFilterId);
}

export function ServiceCatalogListStep({
  catalog,
  serviceCategories,
  selectedServiceId,
  onSelect,
}: ServiceCatalogListStepProps) {
  const catalogForFilters = useMemo(
    () => catalog.map(s => ({ id: s.id, category_id: s.categoryId })),
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
    return filterByCategory(catalog, activeCategoryFilter);
  }, [catalog, showCategoryFilters, activeCategoryFilter]);

  if (catalog.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        No active services yet. Add services in your dashboard, or use a custom
        job.
      </p>
    );
  }

  return (
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
        <div className="space-y-2" role="listbox" aria-label="Your services">
          {displayServices.map(service => {
            const selected = selectedServiceId === service.id;
            const listCents = catalogServiceListPriceCents(service);
            const showFrom =
              service.priceOptionsEnabled && service.priceOptions.length > 1;
            return (
              <button
                key={service.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onSelect(service.id)}
                className={`flex w-full min-h-[52px] cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors ${
                  selected
                    ? 'border-white/40 bg-white/10 text-white'
                    : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white [overflow-wrap:anywhere]">
                    {service.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {formatDurationMinutes(service.durationMinutes)}
                  </span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-zinc-400">
                  {showFrom ? (
                    <span className="text-xs text-zinc-500">
                      from {formatCatalogPriceCents(listCents)}
                    </span>
                  ) : (
                    formatCatalogPriceCents(listCents)
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
  );
}
