'use client';

import {
  getBusinessBookV2CartUrl,
  getBusinessBookV2SetupUrl,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { bookingV2ColumnClass } from '@/features/booking-v2/bookingV2Column';
import { PublicServiceCategoryFilters } from '@/features/business-profile/components/PublicServiceCategoryFilters';
import { getServiceSalePriceCents } from '@/features/marketing/utils/getServiceSalePriceCents';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import { SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID } from '@/features/services/categories/types/serviceCategories';
import type { ServiceCategoryRow } from '@/features/services/categories/types/serviceCategories';
import {
  buildPublicServiceCategoryOptions,
  shouldShowPublicServiceCategoryFilters,
} from '@/features/services/categories/utils/buildPublicServiceCategoryOptions';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import type { BookingV2ServiceChoice } from '../server/loadBookingV2ServiceChoices';
import { formatSetupDollars } from '../utils/formatSetupMoney';
import { ServiceSetupHeader } from './ServiceSetupHeader';

export function BookingV2ServiceList({
  businessSlug,
  bookingFlowLocale,
  services,
  categories,
  sale,
}: {
  businessSlug: string;
  bookingFlowLocale: PublicBookingFlowLocale;
  services: BookingV2ServiceChoice[];
  categories: ServiceCategoryRow[];
  sale: PublicActiveSale | null;
}) {
  const ui = publicBookingUi(bookingFlowLocale);
  const copy = ui.bookingV2;
  const showCategoryFilters = shouldShowPublicServiceCategoryFilters(
    categories,
    services
  );
  const categoryOptions = useMemo(
    () =>
      showCategoryFilters
        ? buildPublicServiceCategoryOptions(
            categories,
            services,
            ui.profile.serviceCategoryOther
          )
        : [],
    [showCategoryFilters, categories, services, ui.profile.serviceCategoryOther]
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

  const visibleServices = useMemo(() => {
    if (!showCategoryFilters || !activeCategoryFilter) return services;
    if (activeCategoryFilter === SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID) {
      return services.filter(service => service.category_id == null);
    }
    return services.filter(
      service => service.category_id === activeCategoryFilter
    );
  }, [services, showCategoryFilters, activeCategoryFilter]);

  return (
    <div
      className={`${bookingV2ColumnClass} flex min-h-screen flex-col bg-[#0F0F0F] text-white`}
    >
      <ServiceSetupHeader
        businessSlug={businessSlug}
        bookingFlowLocale={bookingFlowLocale}
        backHref={getBusinessBookV2CartUrl(businessSlug, {
          lang: bookingFlowLocale,
        })}
        backLabel={copy.back}
      />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-10 pt-7">
        <h1 className="text-[26px] font-bold leading-[1.15] tracking-[-0.6px] text-white">
          {copy.addAService}
        </h1>
        {showCategoryFilters ? (
          <PublicServiceCategoryFilters
            options={categoryOptions}
            value={activeCategoryFilter}
            onChange={setActiveCategoryFilter}
            ariaLabel={ui.profile.serviceCategoriesAriaLabel}
            edgeGutter="bookFlow"
          />
        ) : null}
        <div className="flex flex-col gap-3">
          {visibleServices.map(service => (
            <ServiceChoiceRow
              key={service.id}
              service={service}
              businessSlug={businessSlug}
              bookingFlowLocale={bookingFlowLocale}
              sale={sale}
              startingAtLabel={ui.serviceDetails.startingAt}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function ServiceChoiceRow({
  service,
  businessSlug,
  bookingFlowLocale,
  sale,
  startingAtLabel,
}: {
  service: BookingV2ServiceChoice;
  businessSlug: string;
  bookingFlowLocale: PublicBookingFlowLocale;
  sale: PublicActiveSale | null;
  startingAtLabel: string;
}) {
  const salePrice = getServiceSalePriceCents(service.priceCents, sale);
  const dueCents = salePrice?.saleCents ?? service.priceCents;

  return (
    <Link
      href={getBusinessBookV2SetupUrl(businessSlug, {
        serviceId: service.id,
        lang: bookingFlowLocale,
        add: true,
      })}
      className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-[#262626] bg-[#181818] px-4 py-3.5 hover:bg-[#202020]"
    >
      <span className="min-w-0">
        <span className="block text-[16px] font-semibold leading-5 text-white">
          {service.name}
        </span>
        {service.durationMinutes ? (
          <span className="mt-0.5 block text-[13px] font-normal leading-5 text-[#8F8F8F]">
            {formatDurationMinutes(service.durationMinutes, bookingFlowLocale)}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-right">
        {service.priceOptionsEnabled && service.priceCents > 0 ? (
          <span className="block text-[13px] font-normal leading-4 text-[#8F8F8F]">
            {startingAtLabel}
          </span>
        ) : null}
        <span className="mt-0.5 flex items-baseline justify-end gap-2 whitespace-nowrap">
          {salePrice ? (
            <span className="text-[13px] tabular-nums text-[#8F8F8F] line-through">
              {formatSetupDollars(salePrice.originalCents)}
            </span>
          ) : null}
          <span className="text-[16px] font-semibold tabular-nums text-white">
            {formatSetupDollars(dueCents)}
          </span>
        </span>
      </span>
    </Link>
  );
}
